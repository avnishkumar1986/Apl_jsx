<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPhoto extends Model
{
    protected $table = 'tbl_usrphotos';

    protected $fillable = [
        'user_id', 'photo_type', 'file_name', 'file_path', 'mime_type', 'file_size', 'alt_text',
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
}
