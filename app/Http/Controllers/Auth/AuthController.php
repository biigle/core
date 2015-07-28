<?php

namespace Dias\Http\Controllers\Auth;

use Dias\Http\Controllers\Controller;
use Dias\User;
use Dias\Events\UserLoggedInEvent;
use Validator;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\AuthenticatesAndRegistersUsers;

class AuthController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Registration & Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users, as well as the
    | authentication of existing users. By default, this controller uses
    | a simple trait to add these behaviors. Why don't you explore it?
    |
    */

    // disable default trait and implement own authentication
    use AuthenticatesAndRegistersUsers;

    /**
     * Create a new authentication controller instance.
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest', ['except' => 'getLogout']);

        // The post register / login redirect path.
        $this->redirectTo = route('home');
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @param  array  $data
     * @return \Illuminate\Contracts\Validation\Validator
     */
    public function validator(array $data)
    {
        return Validator::make($data, User::$registerRules);
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array  $data
     * @return User
     */
    public function create(array $data)
    {
        $user = new User;
        $user->firstname = $data['firstname'];
        $user->lastname = $data['lastname'];
        $user->email = $data['email'];
        $user->password = bcrypt($data['password']);
        $user->save();

        return $user;
    }

    /**
     * Handle a login request to the application.
     * Overwrites the trait to show a custom error response.
     *
     * @param  Request  $request
     * @return \Illuminate\Http\Response
     */
    public function postLogin(Request $request)
    {
        $this->validate($request, User::$authRules);

        $credentials = $request->only('email', 'password');

        if (auth()->attempt($credentials, $request->has('remember'))) {
            event(new UserLoggedInEvent(auth()->user()));

            return redirect()->intended($this->redirectPath());
        }

        return redirect('/auth/login')
            ->withInput($request->only('email', 'remember'))
            ->withErrors(['email' => trans('auth.failed')]);
    }

    /**
     * Log the user out of the application.
     * Overwrites the trait to redirect to the `home` route.
     *
     * @return \Illuminate\Http\Response
     */
    public function getLogout()
    {
        auth()->logout();

        return redirect()->route('home');
    }
}
