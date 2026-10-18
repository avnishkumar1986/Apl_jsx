<?php

namespace App\Http\Requests\Admin;

use App\Models\UserType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserTypeRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('status')) {
            $this->merge(['status' => $this->boolean('status')]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('users.manage') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var UserType $userType */
        $userType = $this->route('userType');

        return [
            'uid' => ['nullable', 'string', 'max:10', 'regex:/^USR[0-9]+$/', Rule::unique('tbl_usertype', 'uid')->ignore($userType->id)],
            'name' => ['required', 'string', 'max:100', Rule::unique('tbl_usertype', 'name')->ignore($userType->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'boolean'],
        ];
    }
}
