<?php

namespace Biigle\Observers;

use Biigle\Report;

class UserObserver
{
    /**
     * Require email verification again when a user's email address changes.
     *
     * @param \Biigle\User $user
     */
    public function updating($user)
    {
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
    }

    /**
     * Remove report files of a user that should be deleted.
     *
     * Use deleting instead of delete event because the DB will automatically remove
     * reports when a user was deleted. So we must do this *before* the user was deleted.
     *
     * @param \Biigle\User $user
     */
    public function deleting($user)
    {
        Report::where('user_id', $user->id)
            ->eachById(fn ($report) => $report->deleteFile());
    }
}
