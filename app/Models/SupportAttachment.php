<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportAttachment extends Model
{
    protected $table = 'tbl_support_attachments';
    protected $fillable = ['ticket_id', 'message_id', 'uploaded_by', 'original_name', 'file_name', 'file_path', 'mime_type', 'file_size', 'record_status'];
    protected function casts(): array { return ['record_status' => 'boolean', 'file_size' => 'integer']; }
    public function ticket(): BelongsTo { return $this->belongsTo(SupportTicket::class, 'ticket_id'); }
    public function message(): BelongsTo { return $this->belongsTo(SupportMessage::class, 'message_id'); }
}
