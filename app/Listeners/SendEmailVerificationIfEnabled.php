<?php

namespace Biigle\Listeners;

use Illuminate\Auth\Events\Registered;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class SendEmailVerificationIfEnabled
{
    public function handle(Registered $event): void
    {
        if (!config('biigle.email_verification') || config('biigle.offline_mode')) {
            return;
        }

        try {
            $event->user->sendEmailVerificationNotification();
        } catch (TransportExceptionInterface $exception) {
            report($exception);
            if (request()->hasSession()) {
                session()->flash('message', 'The verification email could not be sent. Please try again later.');
                session()->flash('messageType', 'danger');
            }
        }
    }
}
