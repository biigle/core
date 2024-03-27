<?php

namespace Biigle\Policies;

use Biigle\PendingVolume;
use Biigle\Role;
use Biigle\User;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class PendingVolumePolicy extends CachedPolicy
{
    use HandlesAuthorization;

    /**
     * Intercept all checks.
     *
     * @param User $user
     * @param string $ability
     * @return bool|null
     */
    public function before($user, $ability)
    {
        if ($user->can('sudo')) {
            return true;
        }
    }

    /**
     * Determine if the given pending volume can be accessed by the user.
     */
    public function access(User $user, PendingVolume $pv): bool
    {
        return $user->id === $pv->user_id &&
            $this->remember(
                "pending-volume-can-access-{$user->id}-{$pv->id}",
                fn () =>
                    DB::table('project_user')
                        ->where('project_id', $pv->project_id)
                        ->where('user_id', $user->id)
                        ->where('project_role_id', Role::adminId())
                        ->exists()
            );
    }

    /**
     * Determine if the given pending volume can be updated by the user.
     */
    public function update(User $user, PendingVolume $pv): bool
    {
        return $this->access($user, $pv);
    }

    /**
     * Determine if the given pending volume can be deleted by the user.
     */
    public function destroy(User $user, PendingVolume $pv): bool
    {
        return $this->access($user, $pv);
    }
}
