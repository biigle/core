<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\Transect;
use Illuminate\Auth\Access\HandlesAuthorization;

class TransectPolicy extends CachedPolicy
{
    use HandlesAuthorization;

    /**
     * Intercept all checks
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
     * Determine if the given transect can be accessed by the user.
     *
     * @param  User  $user
     * @param  Transect  $transect
     * @return bool
     */
    public function access(User $user, Transect $transect)
    {
        return $this->remember("transect-can-access-{$user->id}-{$transect->id}", function () use ($user, $transect) {
            return DB::table('project_user')
                ->whereIn('project_id', function ($query) use ($transect) {
                    $query->select('project_id')
                        ->from('project_transect')
                        ->where('transect_id', $transect->id);
                })
                ->where('user_id', $user->id)
                ->exists();
        });
    }

    /**
     * Determine if the user can edit something in the given transect
     *
     * @param  User  $user
     * @param  Transect  $transect
     * @return bool
     */
    public function editIn(User $user, Transect $transect)
    {
        return $this->remember("transect-can-edit-in-{$user->id}-{$transect->id}", function () use ($user, $transect) {
            return DB::table('project_user')
                ->whereIn('project_id', function ($query) use ($transect) {
                    $query->select('project_id')
                        ->from('project_transect')
                        ->where('transect_id', $transect->id);
                })
                ->where('user_id', $user->id)
                ->whereIn('project_role_id', [Role::$editor->id, Role::$admin->id])
                ->exists();
        });
    }

    /**
     * Determine if the given transect can be updated by the user.
     *
     * @param  User  $user
     * @param  Transect  $transect
     * @return bool
     */
    public function update(User $user, Transect $transect)
    {
        return $this->remember("transect-can-update-{$user->id}-{$transect->id}", function () use ($user, $transect) {
            return DB::table('project_user')
                ->whereIn('project_id', function ($query) use ($transect) {
                    $query->select('project_id')
                        ->from('project_transect')
                        ->where('transect_id', $transect->id);
                })
                ->where('user_id', $user->id)
                ->where('project_role_id', Role::$admin->id)
                ->exists();
        });
    }

    /**
     * Determine if the given transect can be deleted by the user.
     *
     * @param  User  $user
     * @param  Transect  $transect
     * @return bool
     */
    public function destroy(User $user, Transect $transect)
    {
        return $this->update($user, $transect);
    }
}
