<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicketHistory extends Model
{
    public $timestamps = false;
    protected $table = 'tbl_support_ticket_history';
    protected $fillable = ['ticket_id', 'action', 'field_name', 'old_value', 'new_value', 'remarks', 'changed_by', 'created_at'];
    protected function casts(): array { return ['created_at' => 'datetime']; }
    public function ticket(): BelongsTo { return $this->belongsTo(SupportTicket::class, 'ticket_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class, 'changed_by', 'unique_id'); }
}
