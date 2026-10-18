<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $table = 'tbl_departments';

    protected $fillable = [
        'department_code', 'department_name', 'description', 'status', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::creating([HasAuditFields::class, 'creating']);
        static::updating([HasAuditFields::class, 'updating']);
    }
}
