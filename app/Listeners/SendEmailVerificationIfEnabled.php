<?php

namespace Biigle\Listeners;

use Illuminate\Auth\Events\Registered;

class SendEmailVerificationIfEnabled
{
    public function handle(Registered $event): void
    {
        if (!config('biigle.email_verification') || config('biigle.offline_mode')) {
            return;
        }

        $event->user->sendEmailVerificationNotification();
    }
}