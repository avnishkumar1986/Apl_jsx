<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleUpload extends Model
{
    protected $table = 'tbl_module_uploads';
    protected $fillable = ['module_id', 'version', 'package_path', 'original_filename', 'file_size', 'checksum_sha256', 'uploaded_by', 'uploaded_at'];
    protected function casts(): array { return ['uploaded_at' => 'datetime', 'file_size' => 'integer']; }
}
