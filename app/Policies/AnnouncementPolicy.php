<?php

namespace Biigle\Policies;

use Biigle\Announcement;
use Biigle\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnouncementPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can create announcements.
     *
     * @param  User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('sudo');
    }

    /**
     * Determine whether the user can delete the announcement.
     *
     * @param  User  $user
     * @param  Announcement  $announcement
     * @return mixed
     */
    public function destroy(User $user, Announcement $announcement)
    {
        return $user->can('sudo');
    }
}
