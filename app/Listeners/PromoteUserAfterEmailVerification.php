<?php

namespace Biigle\Listeners;

use Biigle\Enums\Role;
use Biigle\User;
use Illuminate\Auth\Events\Verified;

class PromoteUserAfterEmailVerification
{
    public function handle(Verified $event): void
    {
        if (config('biigle.user_registration_confirmation') || config('biigle.offline_mode')) {
            return;
        }

        if ($event->user instanceof User && $event->user->role === Role::GUEST) {
            $event->user->role = Role::EDITOR;
            $event->user->save();
        }
    }
}
