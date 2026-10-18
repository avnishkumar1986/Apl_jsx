<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityFinding extends Model
{
    protected $fillable = [
        'ecosystem',
        'package_name',
        'installed_version',
        'vulnerable_versions',
        'advisory_id',
        'title',
        'severity',
        'advisory_url',
        'published_at',
        'raw_data',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'raw_data' => 'array',
        ];
    }

    public function scan(): BelongsTo
    {
        return $this->belongsTo(SecurityScan::class, 'security_scan_id');
    }
}
