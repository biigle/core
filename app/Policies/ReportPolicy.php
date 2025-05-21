<?php

namespace Biigle\Policies;

use Biigle\Report;
use Biigle\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ReportPolicy
{
    use HandlesAuthorization;

    /**
     * Intercept all checks.
     *
     * @param User $user
     * @param string $ability
     * @return bool|void
     */
    public function before($user, $ability)
    {
        if ($user->can('sudo')) {
            return true;
        }
    }

    /**
     * Determine if the given report can be accessed by the user.
     *
     * @param  User  $user
     * @param  Report  $report
     * @return bool
     */
    public function access(User $user, Report $report)
    {
        return $report->user_id === $user->id;
    }

    /**
     * Determine if the given report can be destroyed by the user.
     *
     * @param  User  $user
     * @param  Report  $report
     * @return bool
     */
    public function destroy(User $user, Report $report)
    {
        return $report->user_id === $user->id;
    }
}
