<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApiIntegration extends Model
{
    protected $table = 'tbl_api_integrations';

    protected $fillable = ['name', 'code', 'description', 'api_type', 'endpoint', 'credentials', 'target_table', 'retries', 'retry_delay_seconds', 'timeout_seconds', 'status', 'last_run_status', 'last_run_at', 'created_by', 'updated_by'];

    protected $hidden = ['credentials'];

    protected function casts(): array
    {
        return ['target_table' => 'array', 'credentials' => 'encrypted:array', 'status' => 'boolean', 'last_run_at' => 'datetime', 'retries' => 'integer', 'retry_delay_seconds' => 'integer', 'timeout_seconds' => 'integer'];
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ApiIntegrationLog::class);
    }

    /**
     * Read credentials without allowing data encrypted by an obsolete APP_KEY
     * to break the API integrations screen.
     *
     * @return array{credentials: array<string, mixed>, unreadable: bool}
     */
    public function credentialState(): array
    {
        try {
            return [
                'credentials' => $this->getAttribute('credentials') ?? [],
                'unreadable' => false,
            ];
        } catch (DecryptException) {
            return [
                'credentials' => [],
                'unreadable' => filled($this->getAttributes()['credentials'] ?? null),
            ];
        }
    }

    protected static function booted(): void
    {
        static::creating([HasAuditFields::class, 'creating']);
        static::updating([HasAuditFields::class, 'updating']);
    }
}
