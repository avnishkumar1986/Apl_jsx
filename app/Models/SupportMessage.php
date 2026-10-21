<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportMessage extends Model
{
    use SoftDeletes;
    protected $table = 'tbl_support_messages';
    protected $fillable = ['ticket_id', 'user_id', 'message', 'message_type', 'is_internal', 'record_status'];
    protected function casts(): array { return ['is_internal' => 'boolean', 'record_status' => 'boolean']; }
    public function ticket(): BelongsTo { return $this->belongsTo(SupportTicket::class, 'ticket_id'); }
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id', 'unique_id'); }
    public function attachments(): HasMany { return $this->hasMany(SupportAttachment::class, 'message_id'); }
}
