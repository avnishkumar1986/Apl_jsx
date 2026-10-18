<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Login extends Model
{
    protected $table = 'tbl_usrlogin';

    protected $fillable = [
        'user_id', 'login_name', 'password', 'last_login_at', 'jwt_token', 'jwt_token_expires_at',
        'jwt_token_revoked_at', 'remember_token', 'status', 'created_by', 'updated_by',
    ];

    protected $hidden = ['password', 'jwt_token', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'status' => 'boolean',
            'last_login_at' => 'datetime',
            'jwt_token_expires_at' => 'datetime',
            'jwt_token_revoked_at' => 'datetime',
        ];
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
