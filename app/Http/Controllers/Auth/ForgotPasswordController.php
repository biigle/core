<?php

namespace Biigle\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Biigle\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\SendsPasswordResetEmails;

class ForgotPasswordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Password Reset Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling password reset emails and
    | includes a trait which assists in sending these notifications from
    | your application to your users. Feel free to explore this trait.
    |
    */

    use SendsPasswordResetEmails {
        sendResetLinkEmail as protected baseSendResetLinkEmail;
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
     * Send a reset link to the given user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function sendResetLinkEmail(Request $request)
    {
        if (config('biigle.offline_mode')) {
            abort(404);
        }

        // Transform the username/email to lowercase because we want this to be case
        // insensitive.
        $request->merge(['email' => strtolower($request->input('email'))]);

        return $this->baseSendResetLinkEmail($request);
    }
}
