<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserType extends Model
{
    protected $table = 'tbl_usertype';

    protected $fillable = ['uid', 'name', 'description', 'status', 'created_by', 'updated_by'];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'user_type', 'uid');
    }

    protected static function booted(): void
    {
        static::creating(function (UserType $userType): void {
            if (blank($userType->uid)) {
                $highestNumber = static::query()
                    ->where('uid', 'like', 'USR%')
                    ->pluck('uid')
                    ->map(fn (string $uid): int => (int) substr($uid, 3))
                    ->max() ?? 0;

                $userType->uid = 'USR'.($highestNumber + 1);
            }
        });
        static::creating([HasAuditFields::class, 'creating']);
        static::updating([HasAuditFields::class, 'updating']);
    }
}
