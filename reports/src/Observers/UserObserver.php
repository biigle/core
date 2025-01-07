<?php

namespace Biigle\Modules\Reports\Observers;

use Biigle\Modules\Reports\Report;
use File;

class UserObserver
{
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
            ->eachById(function ($report) {
                return $report->deleteFile();
            });
    }
}
