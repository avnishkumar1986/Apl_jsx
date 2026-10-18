<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $table = 'tbl_usraddress';

    protected $fillable = [
        'user_id', 'address_type', 'address_line_1', 'address_line_2', 'city', 'state', 'district',
        'postal_code', 'country', 'latitude', 'longitude', 'is_primary', 'status', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['latitude' => 'float', 'longitude' => 'float', 'is_primary' => 'boolean', 'status' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted(): void
    {
        static::creating([HasAuditFields::class, 'creating']);
        static::updating([HasAuditFields::class, 'updating']);
    }
}
