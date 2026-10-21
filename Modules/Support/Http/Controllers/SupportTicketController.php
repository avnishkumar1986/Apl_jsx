<?php

namespace Modules\Support\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\ModulePackage;
use App\Models\SupportAttachment;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\SupportTicketHistory;
use App\Models\User;
use App\Notifications\SupportTicketNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupportTicketController extends Controller
{
    private const STATUSES = ['open', 'assigned', 'in_progress', 'waiting_for_user', 'waiting_for_vendor', 'resolved', 'closed', 'reopened', 'cancelled'];

    private const PRIORITIES = ['low', 'medium', 'high', 'critical'];

    public function index(Request $request): Response
    {
        $canManage = $this->canManage($request);
        $query = SupportTicket::query()
            ->with(['module:id,name', 'supportDepartment:id,department_name', 'requester:id,unique_id,first_name,middle_name,last_name', 'assignee:id,unique_id,first_name,middle_name,last_name'])
            ->where('record_status', true)
            ->when(! $canManage, fn ($q) => $q->where('raised_by', $request->user()->unique_id))
            ->when($request->string('search')->trim()->isNotEmpty(), function ($q) use ($request): void {
                $search = '%'.$request->string('search')->trim().'%';
                $q->where(fn ($sub) => $sub->where('ticket_number', 'like', $search)->orWhere('subject', 'like', $search));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('ticket_status', $request->string('status')))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->string('priority')))
            ->latest();

        $tickets = $query->paginate((int) config('datatable.per_page', 10))->withQueryString()->through(fn (SupportTicket $ticket): array => $this->ticketSummary($ticket));

        $scope = SupportTicket::query()->where('record_status', true)->when(! $canManage, fn ($q) => $q->where('raised_by', $request->user()->unique_id));
        $stats = [
            'total' => (clone $scope)->count(),
            'open' => (clone $scope)->whereIn('ticket_status', ['open', 'assigned', 'in_progress', 'reopened'])->count(),
            'waiting' => (clone $scope)->whereIn('ticket_status', ['waiting_for_user', 'waiting_for_vendor'])->count(),
            'resolved' => (clone $scope)->whereIn('ticket_status', ['resolved', 'closed'])->count(),
        ];

        return Inertia::render('modules/support/index', [
            'tickets' => $tickets,
            'modules' => $this->allocatedModules($request)->get(['id', 'name', 'description']),
            'filters' => $request->only(['search', 'status', 'priority']),
            'stats' => $stats,
            'canManage' => $canManage,
            'statuses' => self::STATUSES,
            'priorities' => self::PRIORITIES,
            'supportTeam' => Department::query()->where('department_code', 'IT')->where('status', true)->value('department_name') ?? 'Information Technology',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $allocatedModuleIds = $this->allocatedModules($request)->pluck('id')->all();
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'module_id' => ['required', 'integer', Rule::in($allocatedModuleIds)],
            'priority' => ['required', Rule::in(self::PRIORITIES)],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx,txt'],
        ]);

        $user = $request->user()->loadMissing('departmentAssignment');
        $itDepartmentId = Department::query()->where('department_code', 'IT')->where('status', true)->value('id');
        abort_unless($itDepartmentId, 422, 'The active IT support department is not configured.');
        $ticket = DB::transaction(function () use ($request, $data, $user, $itDepartmentId): SupportTicket {
            $ticket = SupportTicket::create([
                'subject' => $data['subject'],
                'description' => $data['description'],
                'module_id' => $data['module_id'],
                'raised_by' => $user->unique_id,
                'assigned_to' => null,
                'company_id' => $user->departmentAssignment?->company_id,
                'department_id' => $user->departmentAssignment?->department_id,
                'support_department_id' => $itDepartmentId,
                'location' => $user->departmentAssignment?->sitting_location,
                'priority' => $data['priority'],
                'ticket_status' => 'open',
                'due_at' => now()->addHours(24),
                'record_status' => true,
                'created_by' => $user->unique_id,
                'updated_by' => $user->unique_id,
            ]);
            $ticket->update(['ticket_number' => sprintf('SUP-%s-%06d', now()->format('Y'), $ticket->id)]);

            SupportTicketHistory::create(['ticket_id' => $ticket->id, 'action' => 'created', 'remarks' => 'Ticket created from employee portal.', 'changed_by' => $user->unique_id]);
            $this->storeAttachments($request, $ticket, null);

            return $ticket;
        });

        Notification::send(
            $this->itAgents()->where('unique_id', '!=', $user->unique_id)->get(),
            new SupportTicketNotification($ticket->id, $ticket->ticket_number, 'New support ticket', "{$user->name} raised: {$ticket->subject}"),
        );

        return redirect()->route('support.show', $ticket)->with('success', "Ticket {$ticket->ticket_number} created successfully.");
    }

    public function show(Request $request, SupportTicket $ticket): Response
    {
        $this->ensureVisible($request, $ticket);
        $canManage = $this->canManage($request);

        $ticket->load([
            'module:id,name,description,status',
            'supportDepartment:id,department_name',
            'requester:id,unique_id,first_name,middle_name,last_name',
            'assignee:id,unique_id,first_name,middle_name,last_name',
            'attachments',
            'messages' => fn ($q) => $q->where('record_status', true)->when(! $canManage, fn ($sub) => $sub->where('is_internal', false))->with(['author:id,unique_id,first_name,middle_name,last_name', 'attachments'])->oldest(),
            'history' => fn ($q) => $q->with('user:id,unique_id,first_name,middle_name,last_name')->latest('created_at'),
        ]);

        return Inertia::render('modules/support/show', [
            'ticket' => $this->ticketDetail($ticket),
            'canManage' => $canManage,
            'canInternalNote' => $canManage || $request->user()->can('support.internal-notes'),
            'agents' => $canManage ? $this->itAgents()->get()->map(fn (User $user) => ['id' => $user->unique_id, 'name' => $user->name])->values() : [],
            'statuses' => self::STATUSES,
            'priorities' => self::PRIORITIES,
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $this->ensureVisible($request, $ticket);
        $canManage = $this->canManage($request);
        $data = $request->validate([
            'message' => ['required', 'string', 'max:10000'],
            'is_internal' => ['nullable', 'boolean'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx,txt'],
        ]);
        $internal = ($data['is_internal'] ?? false) && ($canManage || $request->user()->can('support.internal-notes'));

        DB::transaction(function () use ($request, $ticket, $data, $internal, $canManage): void {
            $message = SupportMessage::create(['ticket_id' => $ticket->id, 'user_id' => $request->user()->unique_id, 'message' => $data['message'], 'message_type' => $internal ? 'internal_note' : 'reply', 'is_internal' => $internal, 'record_status' => true]);
            $this->storeAttachments($request, $ticket, $message);
            if ($canManage && ! $ticket->first_response_at && ! $internal) {
                $ticket->update(['first_response_at' => now(), 'ticket_status' => $ticket->ticket_status === 'open' ? 'in_progress' : $ticket->ticket_status, 'updated_by' => $request->user()->unique_id]);
            }
            SupportTicketHistory::create(['ticket_id' => $ticket->id, 'action' => $internal ? 'internal_note_added' : 'reply_added', 'changed_by' => $request->user()->unique_id]);
        });

        if (! $internal) {
            if ($canManage) {
                $requester = User::query()->where('unique_id', $ticket->raised_by)->first();
                $requester?->notify(new SupportTicketNotification($ticket->id, $ticket->ticket_number, 'New reply on your ticket', "Support replied to: {$ticket->subject}"));
            } else {
                $recipients = $ticket->assigned_to
                    ? User::query()->where('status', true)->where('unique_id', $ticket->assigned_to)->get()
                    : $this->itAgents()->where('unique_id', '!=', $request->user()->unique_id)->get();
                Notification::send($recipients, new SupportTicketNotification($ticket->id, $ticket->ticket_number, 'Employee replied to a ticket', "{$request->user()->name} replied to: {$ticket->subject}"));
            }
        }

        return back()->with('success', $internal ? 'Internal note added.' : 'Reply added.');
    }

    public function update(Request $request, SupportTicket $ticket): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $previousAssignee = $ticket->assigned_to;
        $previousStatus = $ticket->ticket_status;
        $data = $request->validate([
            'assigned_to' => ['nullable', 'string', Rule::exists('tbl_users', 'unique_id')->where('status', true)],
            'ticket_status' => ['required', Rule::in(self::STATUSES)],
            'priority' => ['required', Rule::in(self::PRIORITIES)],
            'resolution_summary' => ['nullable', 'string', 'max:5000'],
        ]);

        if (! empty($data['assigned_to']) && ! $this->itAgents()->where('unique_id', $data['assigned_to'])->exists()) {
            throw ValidationException::withMessages([
                'assigned_to' => 'The selected agent must be an active employee in the IT department.',
            ]);
        }

        DB::transaction(function () use ($request, $ticket, $data): void {
            foreach (['assigned_to', 'ticket_status', 'priority', 'resolution_summary'] as $field) {
                $old = $ticket->{$field};
                $new = $data[$field] ?? null;
                if ((string) $old !== (string) $new) {
                    SupportTicketHistory::create(['ticket_id' => $ticket->id, 'action' => $field === 'assigned_to' ? 'assigned' : 'updated', 'field_name' => $field, 'old_value' => $old, 'new_value' => $new, 'changed_by' => $request->user()->unique_id]);
                }
            }
            $data['assigned_by'] = $data['assigned_to'] !== $ticket->assigned_to ? $request->user()->unique_id : $ticket->assigned_by;
            $data['resolved_at'] = $data['ticket_status'] === 'resolved' ? ($ticket->resolved_at ?? now()) : $ticket->resolved_at;
            $data['closed_at'] = $data['ticket_status'] === 'closed' ? ($ticket->closed_at ?? now()) : null;
            $data['updated_by'] = $request->user()->unique_id;
            $ticket->update($data);
        });

        if (! empty($data['assigned_to']) && $data['assigned_to'] !== $previousAssignee) {
            User::query()->where('unique_id', $data['assigned_to'])->first()?->notify(
                new SupportTicketNotification($ticket->id, $ticket->ticket_number, 'Ticket assigned to you', $ticket->subject),
            );
        }

        if ($data['ticket_status'] !== $previousStatus) {
            User::query()->where('unique_id', $ticket->raised_by)->first()?->notify(
                new SupportTicketNotification($ticket->id, $ticket->ticket_number, 'Ticket status updated', 'Your ticket is now '.str($data['ticket_status'])->replace('_', ' ')->title().'.'),
            );
        }

        return back()->with('success', 'Ticket updated successfully.');
    }

    public function download(Request $request, SupportAttachment $attachment): StreamedResponse
    {
        $this->ensureVisible($request, $attachment->ticket()->firstOrFail());
        abort_unless(Storage::disk('public')->exists($attachment->file_path), 404);

        return Storage::disk('public')->download($attachment->file_path, $attachment->original_name);
    }

    private function canManage(Request $request): bool
    {
        return $request->user()->hasRole('Super Admin') || $request->user()->can('support.manage') || $request->user()->can('support.view-all');
    }

    private function itAgents()
    {
        return User::query()
            ->where('status', true)
            ->whereHas('departmentAssignment', fn ($query) => $query
                ->where('status', true)
                ->whereHas('department', fn ($department) => $department
                    ->where('department_code', 'IT')
                    ->where('status', true)))
            ->orderBy('first_name')
            ->orderBy('last_name');
    }

    private function allocatedModules(Request $request)
    {
        $query = ModulePackage::query()->where('status', true)->orderBy('name');

        if ($this->canManage($request)) {
            return $query;
        }

        $allocatedSlugs = $request->user()
            ->getAllPermissions()
            ->pluck('name')
            ->map(fn (string $permission): string => str($permission)->before('.')->toString())
            ->unique()
            ->values()
            ->all();

        return $query->whereIn('slug', $allocatedSlugs);
    }

    private function ensureVisible(Request $request, SupportTicket $ticket): void
    {
        abort_unless($this->canManage($request) || $ticket->raised_by === $request->user()->unique_id, 403);
    }

    private function storeAttachments(Request $request, SupportTicket $ticket, ?SupportMessage $message): void
    {
        foreach ($request->file('attachments', []) as $file) {
            $path = $file->store("support-tickets/{$ticket->ticket_number}", 'public');
            SupportAttachment::create(['ticket_id' => $ticket->id, 'message_id' => $message?->id, 'uploaded_by' => $request->user()->unique_id, 'original_name' => $file->getClientOriginalName(), 'file_name' => basename($path), 'file_path' => $path, 'mime_type' => $file->getMimeType(), 'file_size' => $file->getSize(), 'record_status' => true]);
        }
    }

    private function ticketSummary(SupportTicket $ticket): array
    {
        return ['id' => $ticket->id, 'ticket_number' => $ticket->ticket_number, 'subject' => $ticket->subject, 'module' => $ticket->module?->name ?? 'APL Connect', 'support_team' => $ticket->supportDepartment?->department_name ?? 'Information Technology', 'requester' => $ticket->requester?->name, 'assigned_to' => $ticket->assigned_to, 'assignee' => $ticket->assignee?->name, 'priority' => $ticket->priority, 'status' => $ticket->ticket_status, 'due_at' => $ticket->due_at?->toIso8601String(), 'created_at' => $ticket->created_at->toIso8601String()];
    }

    private function ticketDetail(SupportTicket $ticket): array
    {
        return [...$this->ticketSummary($ticket), 'description' => $ticket->description, 'location' => $ticket->location, 'resolution_summary' => $ticket->resolution_summary, 'attachments' => $ticket->attachments->whereNull('message_id')->map(fn ($file) => ['id' => $file->id, 'name' => $file->original_name, 'size' => $file->file_size])->values(), 'messages' => $ticket->messages->map(fn ($message) => ['id' => $message->id, 'message' => $message->message, 'author' => $message->author?->name, 'user_id' => $message->user_id, 'is_internal' => $message->is_internal, 'created_at' => $message->created_at->toIso8601String(), 'attachments' => $message->attachments->map(fn ($file) => ['id' => $file->id, 'name' => $file->original_name, 'size' => $file->file_size])->values()])->values(), 'history' => $ticket->history->map(fn ($item) => ['id' => $item->id, 'action' => $item->action, 'field' => $item->field_name, 'old_value' => $item->old_value, 'new_value' => $item->new_value, 'user' => $item->user?->name, 'created_at' => $item->created_at?->toIso8601String()])->values()];
    }
}
