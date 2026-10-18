<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserTypeRequest;
use App\Http\Requests\Admin\UpdateUserTypeRequest;
use App\Models\UserType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $pageSizeOptions = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $pageSizeOptions, true)) {
            $perPage = (int) config('datatable.per_page');
        }

        $search = trim((string) $request->string('search'));
        $sort = (string) $request->string('sort', 'created_at');
        $direction = $request->string('direction')->lower()->value() === 'asc' ? 'asc' : 'desc';
        $sortableColumns = [
            'sno' => 'id',
            'uid' => 'uid',
            'name' => 'name',
            'description' => 'description',
            'users_count' => 'users_count',
            'status' => 'status',
            'created_at' => 'created_at',
        ];
        if (! array_key_exists($sort, $sortableColumns)) {
            $sort = 'created_at';
        }

        $query = UserType::query()->withCount('users')->orderBy($sortableColumns[$sort], $direction);
        if ($search !== '') {
            $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return Inertia::render('admin/user-types/index', [
            'userTypes' => $query->paginate($perPage)->withQueryString(),
            'filters' => ['search' => $search, 'per_page' => $perPage, 'sort' => $sort, 'direction' => $direction],
            'pageSizeOptions' => $pageSizeOptions,
            'stats' => [
                'total' => UserType::query()->count(),
                'active' => UserType::query()->where('status', true)->count(),
                'assignedUsers' => UserType::query()->withCount('users')->get()->sum('users_count'),
            ],
            'canManage' => auth()->user()?->can('users.manage') ?? false,
        ]);
    }

    public function store(StoreUserTypeRequest $request): RedirectResponse
    {
        UserType::create($request->validated());

        return back()->with('success', 'User type created successfully.');
    }

    public function update(UpdateUserTypeRequest $request, UserType $userType): RedirectResponse
    {
        DB::transaction(function () use ($request, $userType): void {
            $previousUid = $userType->uid;
            $userType->update($request->validated());

            if ($previousUid !== $userType->uid) {
                DB::table('tbl_users')
                    ->where('user_type_id', $previousUid)
                    ->update(['user_type_id' => $userType->uid]);
            }
        });

        return back()->with('success', 'User type updated successfully.');
    }

    public function toggleStatus(Request $request, UserType $userType): RedirectResponse
    {
        abort_unless($request->user()?->can('users.manage'), 403);

        $userType->update([
            'status' => $request->boolean('active'),
        ]);

        return back()->with('success', 'User type status updated successfully.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('users.manage'), 403);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:tbl_usertype,id'],
            'action' => ['required', Rule::in(['activate', 'deactivate', 'delete'])],
        ]);

        $userTypes = UserType::query()->withCount('users')->whereIn('id', $validated['ids'])->get();

        if ($validated['action'] === 'delete' && $userTypes->contains(fn (UserType $userType): bool => $userType->users_count > 0)) {
            throw ValidationException::withMessages([
                'bulk_action' => 'One or more selected user types are assigned to users and cannot be deleted.',
            ]);
        }

        DB::transaction(function () use ($userTypes, $validated): void {
            foreach ($userTypes as $userType) {
                if ($validated['action'] === 'delete') {
                    $userType->delete();
                } else {
                    $userType->update(['status' => $validated['action'] === 'activate']);
                }
            }
        });

        return back()->with('success', 'Bulk action completed successfully.');
    }

    public function destroy(UserType $userType): RedirectResponse
    {
        if ($userType->users()->exists()) {
            throw ValidationException::withMessages([
                'user_type' => 'This user type is assigned to users and cannot be deleted.',
            ]);
        }

        $userType->delete();

        return back()->with('success', 'User type deleted successfully.');
    }
}
