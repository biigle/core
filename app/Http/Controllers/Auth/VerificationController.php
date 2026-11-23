<?php

namespace Biigle\Http\Controllers\Auth;

use Biigle\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

/**
 * Adds application-specific messages and resend limits to email verification.
 *
 * Laravel's EmailVerificationRequest handles link authorization and fulfillment;
 * this controller customizes the responses and rate-limits resend requests.
 */
class VerificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('signed')->only('verify');
        $this->middleware('throttle:6,1')->only('verify');
    }

    public function verify(EmailVerificationRequest $request)
    {
        if (config('biigle.offline_mode')) {
            abort(404);
        }

        if ($request->user()->hasVerifiedEmail()) {
            return $this->verificationResponse('Your email address has already been verified.', 'info');
        }

        $request->fulfill();

        return $this->verificationResponse('Your email address has been verified.', 'success');
    }

    public function resend(Request $request)
    {
        if (config('biigle.offline_mode')) {
            abort(404);
        }

        $limit = RateLimiter::limiter('verification-resend')($request);
        if (RateLimiter::tooManyAttempts($limit->key, $limit->maxAttempts)) {
            return back()
                ->with('message', 'Verification emails are rate limited. Please wait before requesting another email.')
                ->with('messageType', 'danger');
        }

        if ($request->user()->hasVerifiedEmail()) {
            return $this->verificationResponse('Your email address has already been verified.', 'info');
        }

        RateLimiter::hit($limit->key, $limit->decaySeconds);
        try {
            $request->user()->sendEmailVerificationNotification();
        } catch (TransportExceptionInterface $exception) {
            report($exception);

            return $this->verificationResponse('The verification email could not be sent. Please try again later.', 'danger');
        }

        return $this->verificationResponse('A fresh verification link has been sent to your email address.', 'info');
    }

    protected function verificationResponse(string $message, string $messageType)
    {
        return redirect()->route('home')
            ->with('message', $message)
            ->with('messageType', $messageType);
    }
}
