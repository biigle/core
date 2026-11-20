<?php

namespace Biigle\Http\Controllers\Auth;

use Biigle\Http\Controllers\Controller;
use Biigle\Rules\Utf8;
use Illuminate\Foundation\Auth\ResetsPasswords;
use Illuminate\Http\Request;

class ResetPasswordController extends Controller
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

    use ResetsPasswords {
        credentials as baseCredentials;
    }

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
     * Get the password reset credentials from the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    protected function credentials(Request $request)
    {
        // Transform the username/email to lowercase because we want this to be case
        // insensitive.
        $request->merge(['email' => strtolower($request->input('email'))]);

        return $this->baseCredentials($request);
    }

    /**
     * Get the password reset validation rules.
     *
     * @return array
     */
    protected function rules()
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255', new Utf8],
            'password' => ['required', 'string', 'confirmed', 'min:8', new Utf8],
            'token' => ['required', 'string', new Utf8],
        ];
    }
}
