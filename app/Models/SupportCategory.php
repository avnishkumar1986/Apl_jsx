<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportCategory extends Model
{
    protected $table = 'tbl_support_categories';
    protected $fillable = ['name', 'code', 'description', 'department_id', 'default_assignee_id', 'sla_hours', 'status', 'created_by', 'updated_by'];
    protected function casts(): array { return ['status' => 'boolean', 'sla_hours' => 'integer']; }
    public function tickets(): HasMany { return $this->hasMany(SupportTicket::class, 'category_id'); }
}
