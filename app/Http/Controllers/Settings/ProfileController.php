<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\UserPhoto;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load([
            'departmentAssignment.company',
            'departmentAssignment.department',
            'departmentAssignment.designation',
            'contacts',
            'addresses',
            'educations',
            'primaryPhoto',
            'roles',
        ]);
        $employment = $user->departmentAssignment;

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'employeeProfile' => [
                'employee_id' => $user->unique_id,
                'gender' => $user->gender,
                'marital_status' => $user->marital_status,
                'date_of_birth' => $user->date_of_birth?->format('d M Y'),
                'anniversary_date' => $user->anniversary_date?->format('d M Y'),
                'status' => (bool) $user->status,
                'photo_url' => $user->primaryPhoto?->file_path ? Storage::disk('public')->url($user->primaryPhoto->file_path) : null,
                'company' => $employment?->company?->company_name,
                'sitting_location' => $employment?->sitting_location,
                'department' => $employment?->department?->department_name,
                'designation' => $employment?->designation?->designation_name,
                'roles' => $user->roles->pluck('name')->values(),
                'contacts' => $user->contacts->where('status', true)->values()->map(fn ($contact) => [
                    'id' => $contact->id,
                    'type' => $contact->email ? 'Email' : ucfirst($contact->contact_type),
                    'value' => $contact->email ?: trim(($contact->country_code ? $contact->country_code.' ' : '').$contact->contact_number),
                    'primary' => (bool) $contact->is_primary,
                    'verified' => (bool) $contact->is_verified,
                ]),
                'addresses' => $user->addresses->where('status', true)->values()->map(fn ($address) => [
                    'id' => $address->id,
                    'type' => ucfirst($address->address_type),
                    'lines' => collect([$address->address_line_1, $address->address_line_2])->filter()->implode(', '),
                    'location' => collect([$address->city, $address->district, $address->state, $address->postal_code, $address->country])->filter()->implode(', '),
                    'latitude' => $address->latitude,
                    'longitude' => $address->longitude,
                ]),
                'educations' => $user->educations->where('status', true)->values()->map(fn ($education) => [
                    'id' => $education->id,
                    'level' => $education->education_level,
                    'degree' => $education->degree_name,
                    'institution' => $education->institution_name,
                    'university' => $education->university_name ?: $education->board_or_university,
                    'grade' => $education->grade,
                    'period' => collect([$education->start_date?->format('Y'), $education->currently_studying ? 'Present' : $education->end_date?->format('Y')])->filter()->implode(' – '),
                ]),
            ],
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $emailChanged = $request->validated('email') !== $request->user()->email;
            $request->user()->fill(['name' => $request->validated('name')]);

            if ($emailChanged) {
                $request->user()->login()->updateOrCreate(
                    ['user_id' => $request->user()->id],
                    [
                        'username' => $request->validated('email'),
                        'updated_by' => $request->user()->id,
                    ],
                );
                $request->user()->primaryEmail()->updateOrCreate(
                    ['is_primary' => true],
                    [
                        'contact_type' => 'primary',
                        'email' => $request->validated('email'),
                        'is_verified' => false,
                        'email_verified_at' => null,
                        'status' => true,
                        'updated_by' => $request->user()->id,
                    ],
                );
            }

            $request->user()->save();
            $request->user()->unsetRelation('login')->unsetRelation('primaryEmail');
        });

        return to_route('profile.edit');
    }

    /**
     * Store a new primary profile photo for the signed-in employee.
     */
    public function updatePhoto(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();
        $photo = $validated['photo'];
        $path = $photo->store("profile-photos/{$user->unique_id}", 'public');

        DB::transaction(function () use ($user, $photo, $path): void {
            UserPhoto::query()
                ->where('user_id', $user->unique_id)
                ->where('photo_type', 'profile')
                ->where('is_primary', true)
                ->update(['is_primary' => false, 'updated_by' => $user->id]);

            UserPhoto::query()->create([
                'user_id' => $user->unique_id,
                'photo_type' => 'profile',
                'file_name' => $photo->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $photo->getMimeType(),
                'file_size' => $photo->getSize(),
                'alt_text' => "Profile photo for {$user->name}",
                'is_primary' => true,
                'status' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);
        });

        return back()->with('status', 'Profile photo updated successfully.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
