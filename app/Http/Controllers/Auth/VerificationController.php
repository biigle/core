<?php

namespace Biigle\Http\Controllers\Auth;

use Biigle\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

/**
 * Validates email-verification links, customizes responses, and rate-limits resends.
 */
class VerificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('throttle:6,1')->only('verify');
    }

    public function verify(Request $request)
    {
        if (config('biigle.offline_mode')) {
            abort(404);
        }

        $user = $request->user();
        if (!$request->hasValidSignature()) {
            return $this->invalidVerificationLinkResponse();
        }

        if ((string) $request->route('id') !== (string) $user->getKey()) {
            abort(403);
        }

        if (!hash_equals(sha1($user->getEmailForVerification()), (string) $request->route('hash'))) {
            return $this->invalidVerificationLinkResponse();
        }

        if ($user->hasVerifiedEmail()) {
            return $this->verificationResponse('Your email address has already been verified.', 'info');
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

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

    protected function invalidVerificationLinkResponse()
    {
        return $this->verificationResponse(
            'The verification link is invalid or has expired. Please request a new verification email from your dashboard.',
            'danger'
        );
    }

    protected function verificationResponse(string $message, string $messageType)
    {
        return redirect()->route('home')
            ->with('message', $message)
            ->with('messageType', $messageType);
    }
}
