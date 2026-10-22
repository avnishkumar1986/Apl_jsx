<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contact extends Model
{
    protected $table = 'tbl_usrcontact';

    protected $fillable = [
        'usr_type', 'user_id', 'contact_type', 'email', 'contact_number', 'is_primary', 'is_verified', 'email_verified_at', 'phone_verified_at',
        'status', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean', 'is_verified' => 'boolean', 'status' => 'boolean',
            'email_verified_at' => 'datetime', 'phone_verified_at' => 'datetime',
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
