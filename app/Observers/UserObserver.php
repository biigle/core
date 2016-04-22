<?php

namespace Dias\Observers;

use Dias\Role;

class UserObserver
{
    /**
     * A user gets the global role 'editor' by default.
     *
     * @param \Dias\User $user
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

    /**
     * Removes the user from all project memberships, thus checking if it is
     * allowed to delete the user.
     *
     * If the user were the last admin of a project for example, they mustn't
     * be deleted.
     *
     * @param \Dias\User $user
     *
     * @return bool
     */
    public function deleting($user)
    {
        foreach ($user->projects as $project) {
            $project->removeUserId($user->id);
        }

        return true;
    }
}
