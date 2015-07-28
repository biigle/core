<?php

namespace Dias\Http\Controllers\Auth;

use Dias\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Foundation\Auth\ResetsPasswords;

class PasswordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Password Reset Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling password reset requests
    | and uses a simple trait to include this behavior. You're free to
    | explore this trait and override any methods you wish to tweak.
    |
    */

    use ResetsPasswords;

    /**
     * Create a new password controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->redirectTo = route('home');
        $this->subject = trans('auth.pw_reset_subject');

        $this->middleware('guest');
    }

    /**
     * Overrides the default method to exclude the password in the error
     * response.
     *
     * @param  Request  $request
     * @return \Illuminate\Http\Response
     */
    public function postReset(Request $request)
    {
        $this->validate($request, \Dias\User::$resetRules);

        $credentials = $request->only(
            'email', 'password', 'password_confirmation', 'token'
        );

        $response = Password::reset($credentials, function ($user, $password) {
         $this->resetPassword($user, $password);
     });

        switch ($response) {
         case Password::PASSWORD_RESET:
             return redirect($this->redirectPath());

         default:
             return redirect()->back()
                         ->withInput($request->only('email'))
                         ->withErrors(['email' => trans($response)]);
     }
    }
}
