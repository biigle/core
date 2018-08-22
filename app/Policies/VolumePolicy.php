<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\Volume;
use Illuminate\Auth\Access\HandlesAuthorization;

class VolumePolicy extends CachedPolicy
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
        if ($user->isAdmin) {
            return true;
        }
    }

    /**
     * Determine if the given volume can be accessed by the user.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function access(User $user, Volume $volume)
    {
        return $this->remember("volume-can-access-{$user->id}-{$volume->id}", function () use ($user, $volume) {
            return $this->getBaseQuery($user, $volume)->exists();
        });
    }

    /**
     * Determine if the user can edit something in the given volume.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function editIn(User $user, Volume $volume)
    {
        return $this->remember("volume-can-edit-in-{$user->id}-{$volume->id}", function () use ($user, $volume) {
            return $this->getBaseQuery($user, $volume)
                ->whereIn('project_role_id', [Role::$editor->id, Role::$admin->id])
                ->exists();
        });
    }

    /**
     * Determine if the user can edit things created by other users in the given volume.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function forceEditIn(User $user, Volume $volume)
    {
        return $this->remember("volume-can-force-edit-in-{$user->id}-{$volume->id}", function () use ($user, $volume) {
            return $this->getBaseQuery($user, $volume)
                ->where('project_role_id', Role::$admin->id)
                ->exists();
        });
    }

    /**
     * Determine if the given volume can be updated by the user.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function update(User $user, Volume $volume)
    {
        return $this->remember("volume-can-update-{$user->id}-{$volume->id}", function () use ($user, $volume) {
            return $this->getBaseQuery($user, $volume)
                ->where('project_role_id', Role::$admin->id)
                ->exists();
        });
    }

    /**
     * Determine if the given volume can be deleted by the user.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function destroy(User $user, Volume $volume)
    {
        return $this->update($user, $volume);
    }

    /**
     * Get the base query for all policy methods.
     *
     * @param User $user
     * @param Volume $volume
     *
     * @return QueryBuilder
     */
    protected function getBaseQuery(User $user, Volume $volume)
    {
        return DB::table('project_user')
            ->whereIn('project_id', function ($query) use ($volume) {
                $query->select('project_id')
                    ->from('project_volume')
                    ->where('volume_id', $volume->id);
            })
            ->where('user_id', $user->id);
    }
}
