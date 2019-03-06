<?php

namespace Biigle\Http\Controllers\Auth;

use View;
use Validator;
use Biigle\User;
use Biigle\Role;
use Notification;
use Ramsey\Uuid\Uuid;
use Illuminate\Http\Request;
use Biigle\Http\Requests\StoreUser;
use Biigle\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\RegistersUsers;
use Biigle\Notifications\RegistrationConfirmation;

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
        $user->password = bcrypt($data['password']);
        $user->uuid = Uuid::uuid4();
        if ($this->isAdminConfirmationEnabled()) {
            $user->role_id = Role::guestId();
        } else {
            $user->role_id = Role::editorId();
        }
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
            abort(404);
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
        if ($this->isRegistrationDisabled()) {
            abort(404);
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
        return config('biigle.user_registration_confirmation');
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

        return redirect($this->redirectPath())
            ->with('welcomeMessage', true);
    }
}
