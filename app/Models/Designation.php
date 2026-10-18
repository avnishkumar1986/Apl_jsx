<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;

class Designation extends Model
{
    protected $table = 'tbl_designations';

    protected $fillable = [
        'des_id', 'designation_name', 'designation_level_id',
        'reports_to_designation_id', 'reporting_to', 'department_id',
        'department', 'sitting_place', 'status', 'created_by', 'updated_by',
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
