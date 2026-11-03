<?php

namespace Biigle\Http\Controllers\Auth;

use Biigle\Http\Controllers\Controller;
use Biigle\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\VerifiesEmails;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class VerificationController extends Controller
{
    use VerifiesEmails;

    public function __construct()
    {
        $this->middleware('auth')->except('verify');
        $this->middleware('throttle:6,1')->only('verify', 'resend');
    }

    public function verify(Request $request)
    {
        if (! URL::hasValidSignature($request)) {
            return $this->verificationFailed();
        }

        $user = User::find($request->route('id'));
        if (!$user || !hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return $this->verificationFailed();
        }

        if ($user->hasVerifiedEmail()) {
            return $this->verificationResponse('Your email address has already been verified. You may now log in.', 'info');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return $this->verificationResponse('Your email address has been verified. You may now log in.', 'success');
    }

    protected function verificationResponse(string $message, string $messageType)
    {
        return redirect()->route('login')
            ->with('message', $message)
            ->with('messageType', $messageType);
    }

    protected function verificationFailed()
    {
        return $this->verificationResponse('This email verification link is invalid or has expired.', 'danger');
    }
}