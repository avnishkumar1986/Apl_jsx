<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('roles.manage') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('tbl_roles', 'name')->where('guard_name', 'web')],
            'company_ids' => ['array'],
            'company_ids.*' => ['integer', 'distinct', Rule::exists('tbl_company', 'id')->where('status', true)],
            'department_id' => ['nullable', 'integer', Rule::exists('tbl_departments', 'id')->where('status', true)],
            'designation_id' => ['nullable', 'integer', Rule::exists('tbl_designations', 'id')->where('status', true)],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists('tbl_permissions', 'name')->where('guard_name', 'web')],
        ];
    }
}
