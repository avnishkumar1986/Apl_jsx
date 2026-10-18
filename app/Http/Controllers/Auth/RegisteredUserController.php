<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Login;
use App\Models\Role;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:tbl_usrcontact,email|unique:tbl_usrlogin,login_name',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'user_type_id' => UserType::query()->where('status', true)->value('uid'),
                'name' => $request->name,
                'status' => true,
            ]);

            Login::create([
                'user_id' => $user->id,
                'login_name' => $request->email,
                'password' => $request->password,
                'status' => true,
            ]);

            Contact::create([
                'user_id' => $user->unique_id,
                'contact_type' => 'primary',
                'email' => $request->email,
                'is_primary' => true,
                'status' => true,
            ]);

            $user->assignRole(Role::findOrCreate('Viewer', 'web'));

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return to_route('dashboard');
    }
}
