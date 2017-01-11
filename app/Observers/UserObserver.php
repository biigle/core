<?php

namespace Biigle\Observers;

use Biigle\Role;

class UserObserver
{
    /**
     * A user gets the global role 'editor' by default.
     *
     * @param \Biigle\User $user
     *
     * @return bool
     */
    public function creating($user)
    {
        if ($user->role_id === null) {
            $user->role_id = Role::$editor->id;
        }

        return true;
    }
}
