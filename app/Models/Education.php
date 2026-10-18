<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Education extends Model
{
    protected $table = 'tbl_usreducation';

    protected $fillable = ['user_id', 'education_level', 'degree_name', 'institution_name', 'university_name', 'board_or_university', 'start_date', 'end_date', 'grade', 'currently_studying', 'document_path', 'status'];

    protected function casts(): array
    {
        return ['start_date' => 'date:Y-m-d', 'end_date' => 'date:Y-m-d', 'currently_studying' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
