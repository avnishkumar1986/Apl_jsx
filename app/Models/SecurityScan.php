<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SecurityScan extends Model
{
    protected $fillable = [
        'status',
        'score',
        'total_findings',
        'critical_findings',
        'high_findings',
        'medium_findings',
        'low_findings',
        'summary',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'summary' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function findings(): HasMany
    {
        return $this->hasMany(SecurityFinding::class);
    }
}
