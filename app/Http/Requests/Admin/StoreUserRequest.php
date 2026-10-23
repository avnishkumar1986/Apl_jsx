<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreUserRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'role' => $this->input('role', 'Viewer'),
            'permanent_same_as_local' => $this->boolean('permanent_same_as_local'),
        ]);
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
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'unique_id' => ['nullable', 'string', 'max:20', 'unique:tbl_users,unique_id'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'marital_status' => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'anniversary_date' => ['nullable', 'date'],
            'user_type' => ['required', Rule::exists('tbl_usertype', 'uid')->where('status', true)],
            'company' => ['nullable', 'string', 'max:150'],
            'sitting_location' => ['nullable', 'string', 'max:150'],
            'department_id' => ['nullable', 'integer', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! in_array((int) $value, [10, 20, 30], true) && ! DB::table('tbl_departments')->where('id', $value)->where('status', true)->exists()) {
                    $fail('Select a valid department.');
                }
            }],
            'designation_id' => ['nullable', 'integer', Rule::exists('tbl_designations', 'des_id')->where('status', true)],
            'role' => ['required', 'string', Rule::exists('tbl_roles', 'name')->where('guard_name', 'web')->where('status', true)],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:tbl_usrcontact,email', 'unique:tbl_usrlogin,username'],
            'username' => ['required', 'string', 'max:255', 'unique:tbl_usrlogin,username', 'unique:tbl_usrcontact,email'],
            'password' => ['required', 'string', 'min:8'],
            'aadhaar_number' => ['nullable', 'regex:/^[0-9]{12}$/', Rule::unique('tbl_usrdocument', 'document_number')->where('document_type', 'aadhaar')],
            'aadhaar_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'pan_number' => ['nullable', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/', Rule::unique('tbl_usrdocument', 'document_number')->where('document_type', 'pan')],
            'pan_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'contact_type' => ['nullable', Rule::in(['mobile', 'phone', 'office', 'other'])],
            'contact_value' => ['nullable', 'string', 'max:100'],
            'contacts' => ['nullable', 'array', 'max:10'],
            'contacts.*.id' => ['nullable', 'integer'],
            'contacts.*.contact_type' => ['required', Rule::in(['mobile', 'email', 'phone', 'office', 'other'])],
            'contacts.*.contact_value' => ['nullable', 'string', 'max:255'],
            'contacts.*.is_primary' => ['required', 'boolean'],
            'address_type' => ['nullable', Rule::in(['local', 'permanent'])],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'permanent_same_as_local' => ['required', 'boolean'],
            'permanent_address_line_1' => ['nullable', 'string', 'max:255'],
            'permanent_address_line_2' => ['nullable', 'string', 'max:255'],
            'permanent_city' => ['nullable', 'string', 'max:100'],
            'permanent_state' => ['nullable', 'string', 'max:100'],
            'permanent_district' => ['nullable', 'string', 'max:100'],
            'permanent_postal_code' => ['nullable', 'string', 'max:20'],
            'permanent_country' => ['nullable', 'string', 'max:100'],
            'permanent_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'permanent_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'educations' => ['nullable', 'array', 'max:10'],
            'educations.*.id' => ['nullable', 'integer'],
            'educations.*.education_level' => ['nullable', 'string', 'max:100'],
            'educations.*.degree_name' => ['nullable', 'string', 'max:150'],
            'educations.*.institution_name' => ['nullable', 'string', 'max:255'],
            'educations.*.university_name' => ['nullable', 'string', 'max:255'],
            'educations.*.start_date' => ['nullable', 'date'],
            'educations.*.end_date' => ['nullable', 'date', 'after_or_equal:educations.*.start_date'],
            'educations.*.grade' => ['nullable', 'string', 'max:50'],
            'educations.*.currently_studying' => ['required', 'boolean'],
            'educations.*.document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'bank_name' => ['nullable', 'string', 'max:150', 'required_with:account_number,account_type,branch_name,ifsc_code'],
            'account_number' => ['nullable', 'string', 'max:50', 'required_with:bank_name,account_type,branch_name,ifsc_code'],
            'account_type' => ['nullable', 'string', 'max:30'],
            'branch_name' => ['nullable', 'string', 'max:150'],
            'ifsc_code' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ($this->input('contacts', []) as $index => $contact) {
                if (($contact['contact_type'] ?? null) === 'email' &&
                    filled($contact['contact_value'] ?? null) &&
                    filter_var($contact['contact_value'], FILTER_VALIDATE_EMAIL) === false) {
                    $validator->errors()->add("contacts.{$index}.contact_value", 'Enter a valid email address.');
                }
            }
        });
    }
}
