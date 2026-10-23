<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Banking extends Model
{
    protected $table = 'tbl_usrbanking';

    protected $fillable = [
        'user_id', 'bank_name', 'account_number', 'account_type', 'branch_name', 'ifsc_code',
        'is_primary', 'status', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean', 'status' => 'boolean'];
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
