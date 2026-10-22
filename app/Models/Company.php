<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Company extends Model
{
    protected $table = 'tbl_company';

    protected $fillable = ['company_code', 'company_name', 'record_type', 'parent_company_id', 'address_id', 'contact_id', 'gstin', 'pan', 'status', 'created_by', 'updated_by'];

    protected function casts(): array
    {
        return ['record_type' => 'integer', 'status' => 'boolean'];
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'address_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    protected static function booted(): void
    {
        static::creating([HasAuditFields::class, 'creating']);
        static::updating([HasAuditFields::class, 'updating']);
    }
}
