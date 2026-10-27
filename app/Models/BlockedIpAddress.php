<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedIpAddress extends Model
{
    protected $table = 'tbl_blocked_ips';

    protected $fillable = [
        'ip_address',
        'reason',
        'blocked_by',
        'blocked_at',
        'expires_at',
        'unblocked_by',
        'unblocked_at',
    ];

    protected function casts(): array
    {
        return [
            'blocked_at' => 'datetime',
            'expires_at' => 'datetime',
            'unblocked_at' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->whereNull('unblocked_at')
            ->where(fn (Builder $query): Builder => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    public function blockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_by');
    }

    public function unblockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'unblocked_by');
    }
}
