<?php

namespace Biigle\Listeners;

use Biigle\Enums\Role;
use Biigle\Notifications\RegistrationConfirmation;
use Biigle\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Notification;

class SendRegistrationConfirmationAfterEmailVerification
{
    public function handle(Verified $event): void
    {
        if (
            config('biigle.offline_mode')
            || !config('biigle.email_verification')
            || !config('biigle.user_registration_confirmation')
        ) {
            return;
        }

        $user = $event->user;
        if (!$user instanceof User || $user->role !== Role::GUEST) {
            return;
        }

        $notifiable = Notification::route('mail', config('biigle.admin_email'));
        Notification::send($notifiable, new RegistrationConfirmation($user));
    }
}
