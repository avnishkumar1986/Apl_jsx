<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportTicket extends Model
{
    use SoftDeletes;
    protected $table = 'tbl_support_tickets';
    protected $fillable = ['ticket_number', 'subject', 'description', 'module_id', 'category_id', 'raised_by', 'assigned_to', 'assigned_by', 'company_id', 'department_id', 'support_department_id', 'location', 'priority', 'ticket_status', 'source', 'due_at', 'first_response_at', 'resolved_at', 'closed_at', 'resolution_summary', 'record_status', 'created_by', 'updated_by'];
    protected function casts(): array { return ['record_status' => 'boolean', 'due_at' => 'datetime', 'first_response_at' => 'datetime', 'resolved_at' => 'datetime', 'closed_at' => 'datetime']; }
    public function category(): BelongsTo { return $this->belongsTo(SupportCategory::class, 'category_id'); }
    public function module(): BelongsTo { return $this->belongsTo(ModulePackage::class, 'module_id'); }
    public function supportDepartment(): BelongsTo { return $this->belongsTo(Department::class, 'support_department_id'); }
    public function requester(): BelongsTo { return $this->belongsTo(User::class, 'raised_by', 'unique_id'); }
    public function assignee(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to', 'unique_id'); }
    public function messages(): HasMany { return $this->hasMany(SupportMessage::class, 'ticket_id'); }
    public function attachments(): HasMany { return $this->hasMany(SupportAttachment::class, 'ticket_id'); }
    public function history(): HasMany { return $this->hasMany(SupportTicketHistory::class, 'ticket_id'); }
}
