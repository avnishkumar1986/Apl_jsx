<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DesignationLevel extends Model
{
    protected $table = 'tbl_designation_levels';

    protected $fillable = ['level_code', 'level_name', 'hierarchy_order', 'reports_to_level_id', 'status'];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }
}
