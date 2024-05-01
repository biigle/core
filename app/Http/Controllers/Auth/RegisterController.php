<?php

namespace Biigle\Http\Controllers\Auth;

use Biigle\Http\Controllers\Controller;
use Biigle\Http\Requests\StoreUser;
use Biigle\Notifications\RegistrationConfirmation;
use Biigle\Role;
use Biigle\Services\Modules;
use Biigle\User;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Notification;
use Ramsey\Uuid\Uuid;
use Validator;
use View;

class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    use RegistersUsers {
        showRegistrationForm as protected baseShowRegistrationForm;
        register as baseRegister;
    }

    /**
     * Where to redirect users after login / registration.
     *
     * @var string
     */
    protected $redirectTo = '/';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest');
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @param  array  $data
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        // Email should be case insensitive
        if (array_key_exists('email', $data)) {
            $data['email'] = strtolower($data['email']);
        }

        $rules = (new StoreUser)->rules();
        $additionalRules = [
            'website' => 'honeypot',
            'homepage' => 'honeytime:5|required',
            'affiliation' => 'required|max:255',
        ];

        if (View::exists('privacy')) {
            $additionalRules['privacy'] = 'required|accepted';
        }

        if (View::exists('terms')) {
            $additionalRules['terms'] = 'required|accepted';
        }

        return Validator::make($data, array_merge($rules, $additionalRules));
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array  $data
     * @return \Biigle\User
     */
    protected function create(array $data)
    {
        $user = new User;
        $user->firstname = $data['firstname'];
        $user->lastname = $data['lastname'];
        $user->affiliation = $data['affiliation'];
        $user->email = $data['email'];
        $user->password = Hash::make($data['password']);
        $user->uuid = Uuid::uuid4();
        if ($this->isAdminConfirmationEnabled()) {
            $user->role_id = Role::guestId();
        } else {
            $user->role_id = Role::editorId();
        }

        app()->make(Modules::class)->callControllerMixins('createNewUser', [
            'user' => $user,
            'data' => $data,
        ]);

        $user->save();

        return $user;
    }

    /**
     * Show the application registration form.
     *
     * @return \Illuminate\Http\Response
     */
    public function showRegistrationForm()
    {
        if ($this->isRegistrationDisabled()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $this->baseShowRegistrationForm();
    }

    /**
     * Handle a registration request for the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function register(Request $request)
    {
        if ($this->isRegistrationDisabled() || config('biigle.sso_registration_only')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $this->baseRegister($request);
    }

    /**
     * Determines if the user registration mechansim is disabled.
     *
     * @return bool
     */
    protected function isRegistrationDisabled()
    {
        return !config('biigle.user_registration');
    }

    /**
     * Determines if the user registration confirmation by admins is enabled.
     *
     * @return bool
     */
    protected function isAdminConfirmationEnabled()
    {
        return config('biigle.user_registration_confirmation') && !config('biigle.offline_mode');
    }

    /**
     * The user has been registered.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $user
     * @return mixed
     */
    protected function registered(Request $request, $user)
    {
        if ($this->isAdminConfirmationEnabled()) {
            $notifiable = Notification::route('mail', config('biigle.admin_email'));
            Notification::send($notifiable, new RegistrationConfirmation($user));
        }

        // Redirect to the intended path in case users came from a project invitation.
        return redirect()->intended($this->redirectPath())
            ->with('welcomeMessage', true);
    }
}
