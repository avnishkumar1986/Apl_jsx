<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    private ?string $pendingEmail = null;

    private ?string $pendingPassword = null;

    private mixed $pendingEmailVerifiedAt = null;

    private ?string $pendingRememberToken = null;

    private ?string $pendingName = null;

    protected $table = 'tbl_users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'user_type_id',
        'unique_id',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'marital_status',
        'date_of_birth',
        'anniversary_date',
        'contact_id',
        'employment_id',
        'education_id',
        'address_id',
        'status',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $appends = ['name', 'email', 'email_verified_at', 'company', 'sitting_location', 'department_id', 'designation_id', 'aadhaar_number', 'aadhaar_image', 'pan_number', 'pan_image'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'anniversary_date' => 'date',
            'status' => 'boolean',
        ];
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function userType(): BelongsTo
    {
        return $this->belongsTo(UserType::class, 'user_type_id', 'uid');
    }

    public function departmentAssignment(): HasOne
    {
        return $this->hasOne(UserDepartment::class, 'user_id', 'unique_id')->where('status', true);
    }

    public function department(): HasOneThrough
    {
        return $this->hasOneThrough(
            Department::class,
            UserDepartment::class,
            'user_id',
            'id',
            'unique_id',
            'department_id',
        )->where('tbl_usrdept.status', true);
    }

    public function getDepartmentIdAttribute(): ?int
    {
        $departmentId = $this->departmentAssignment?->department_id;

        return $departmentId === null ? null : (int) $departmentId;
    }

    public function getDesignationIdAttribute(): ?int
    {
        $designationId = $this->departmentAssignment?->designation_id;

        return $designationId === null ? null : (int) $designationId;
    }

    public function getCompanyAttribute(): ?string
    {
        return $this->departmentAssignment?->company?->company_name;
    }

    public function getSittingLocationAttribute(): ?string
    {
        return $this->departmentAssignment?->sitting_location;
    }

    public function designation(): HasOneThrough
    {
        return $this->hasOneThrough(
            Designation::class,
            UserDepartment::class,
            'user_id',
            'id',
            'unique_id',
            'designation_id',
        )->where('tbl_usrdept.status', true);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function educations(): HasMany
    {
        return $this->hasMany(Education::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'user_id', 'unique_id');
    }

    public function emails(): HasMany
    {
        return $this->hasMany(Contact::class, 'user_id', 'unique_id')->whereNotNull('email');
    }

    public function primaryEmail(): HasOne
    {
        return $this->hasOne(Contact::class, 'user_id', 'unique_id')->where('is_primary', true)->whereNotNull('email');
    }

    public function primaryPhoto(): HasOne
    {
        return $this->hasOne(UserPhoto::class, 'user_id', 'unique_id')
            ->where('photo_type', 'profile')
            ->where('is_primary', true)
            ->where('status', true);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(UserDocument::class, 'user_id', 'unique_id');
    }

    public function getAadhaarNumberAttribute(): ?string
    {
        return $this->identityDocument('aadhaar')?->document_number;
    }

    public function getAadhaarImageAttribute(): ?string
    {
        return $this->identityDocument('aadhaar')?->file_path;
    }

    public function getPanNumberAttribute(): ?string
    {
        return $this->identityDocument('pan')?->document_number;
    }

    public function getPanImageAttribute(): ?string
    {
        return $this->identityDocument('pan')?->file_path;
    }

    private function identityDocument(string $type): ?UserDocument
    {
        if ($this->relationLoaded('documents')) {
            return $this->documents->firstWhere('document_type', $type);
        }

        return $this->documents()->where('document_type', $type)->first();
    }

    public function login(): HasOne
    {
        return $this->hasOne(Login::class);
    }

    public function getAuthPassword(): string
    {
        return $this->login?->status ? (string) $this->login->password : '';
    }

    public function getRememberToken(): ?string
    {
        return $this->login?->remember_token;
    }

    public function setRememberToken($value): void
    {
        $this->login()->update(['remember_token' => $value]);
        $this->unsetRelation('login');
    }

    public function getEmailAttribute(): ?string
    {
        return $this->primaryEmail?->email ?? $this->login?->login_name ?? $this->pendingEmail;
    }

    public function getNameAttribute(): string
    {
        return trim(collect([$this->first_name, $this->middle_name, $this->last_name])->filter()->implode(' '))
            ?: ($this->attributes['name'] ?? $this->pendingName ?? 'User');
    }

    public function setNameAttribute(?string $value): void
    {
        $this->pendingName = $value;
        $this->attributes['name'] = $value;
    }

    public function getEmailVerifiedAtAttribute(): mixed
    {
        return $this->primaryEmail?->is_verified ? $this->primaryEmail->updated_at : $this->pendingEmailVerifiedAt;
    }

    public function setEmailAttribute(?string $value): void
    {
        $this->pendingEmail = $value;
    }

    public function setPasswordAttribute(?string $value): void
    {
        $this->pendingPassword = $value;
    }

    public function setEmailVerifiedAtAttribute(mixed $value): void
    {
        $this->pendingEmailVerifiedAt = $value;
    }

    public function setRememberTokenAttribute(?string $value): void
    {
        $this->pendingRememberToken = $value;
    }

    public function pendingPassword(): ?string
    {
        return $this->pendingPassword;
    }

    public function pendingRememberToken(): ?string
    {
        return $this->pendingRememberToken;
    }

    public function routeNotificationForMail(): ?string
    {
        return $this->email;
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (blank($user->unique_id)) {
                do {
                    $uniqueId = 'USR'.Str::upper(Str::random(7));
                } while (self::query()->where('unique_id', $uniqueId)->exists());

                $user->unique_id = $uniqueId;
            }
        });
        static::creating([HasAuditFields::class, 'creating']);
        static::updating([HasAuditFields::class, 'updating']);
    }
}
