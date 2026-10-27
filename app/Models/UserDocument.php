<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDocument extends Model
{
    protected $table = 'tbl_usrdocument';

    protected $fillable = [
        'user_type',
        'user_id',
        'document_type',
        'document_number',
        'document_name',
        'file_path',
        'mime_type',
        'file_size',
        'issue_date',
        'expiry_date',
        'status',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'issue_date' => 'date',
            'expiry_date' => 'date',
            'status' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'unique_id');
    }

    protected static function booted(): void
    {
        static::creating([HasAuditFields::class, 'creating']);
        static::updating([HasAuditFields::class, 'updating']);
    }
}
