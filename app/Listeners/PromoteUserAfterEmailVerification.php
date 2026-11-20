<?php

namespace Biigle\Listeners;

use Biigle\Enums\Role;
use Biigle\User;
use Illuminate\Auth\Events\Verified;

class PromoteUserAfterEmailVerification
{
    public function handle(Verified $event): void
    {
        if (config('biigle.offline_mode')) {
            return;
        }

        $user = $event->user;
        if (!$user instanceof User) {
            return;
        }

        if (
            $user->role === Role::GUEST
            && (!config('biigle.user_registration_confirmation') || $user->registration_approved_at)
        ) {
            $user->role = Role::EDITOR;
            $user->save();
        }
    }
}
