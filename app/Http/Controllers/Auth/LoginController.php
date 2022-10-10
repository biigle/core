<?php

namespace Biigle\Http\Controllers\Auth;

use Biigle\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Foundation\Auth\ThrottlesLogins;
use Illuminate\Http\Request;

class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    // use ThrottlesLogins;
    use AuthenticatesUsers {
        credentials as protected baseCredentials;
        attemptLogin as protected baseAttemptLogin;
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
        $this->middleware('guest')->except('logout');
    }

    /**
     * Get the needed authorization credentials from the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    protected function credentials(Request $request)
    {
        // Transform the username/email to lowercase because we want this to be case
        // insensitive.
        $username = $this->username();
        $request->merge([$username => strtolower($request->input($username))]);

        return $this->baseCredentials($request);
    }

    /**
     * Attempt to log the user into the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function attemptLogin(Request $request)
    {
        // Users should be "remembered" by default until they log out.
        $request->merge(['remember' => true]);

        return $this->baseAttemptLogin($request);
    }
}
