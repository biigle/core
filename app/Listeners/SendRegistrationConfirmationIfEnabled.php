<?php

namespace Biigle\Listeners;

use Biigle\Notifications\RegistrationConfirmation;
use Biigle\User;
use Illuminate\Auth\Events\Verified;
use Notification;

class SendRegistrationConfirmationIfEnabled
{
    public function handle(Verified $event): void
    {
        if (!config('biigle.user_registration_confirmation') || config('biigle.offline_mode')) {
            return;
        }

        if (!$event->user instanceof User) {
            return;
        }

        Notification::route('mail', config('biigle.admin_email'))
            ->notify(new RegistrationConfirmation($event->user));
    }
}
