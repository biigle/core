<?php

namespace Biigle\Policies;

use DB;
use Cache;
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
     * Determine if the user can access the given volume.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function access(User $user, Volume $volume)
    {
        // Put this to permanent cache for rapid querying of image thumbnails or
        // annotations later.
        return Cache::remember("volume-can-access-{$user->id}-{$volume->id}", 0.5, function () use ($user, $volume) {
            // TODO This is the implicit volume access through project membership.
            // Add the explicit access through volume membership.

            // Check if user is member of one of the projects, the volume belongs to.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.volume_id', $volume->id)
                ->exists();
        });
    }

    /**
     * Determine if the user can access the given volume through the given project.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @param  int  $pid Project ID
     * @return bool
     */
    public function accessThroughProject(User $user, Volume $volume, $pid)
    {
        // Put this to permanent cache for rapid querying of volume thumbnails or
        // annotations later.
        return Cache::remember("volume-can-access-through-project-{$user->id}-{$volume->id}-{$pid}", 0.5, function () use ($user, $volume, $pid) {

            // Check if user and volume belong to same the project.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.volume_id', $volume->id)
                ->where('project_volume.project_id', $pid)
                ->exists();
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
            return DB::table('project_user')
                ->whereIn('project_id', function ($query) use ($volume) {
                    $query->select('project_id')
                        ->from('project_volume')
                        ->where('volume_id', $volume->id);
                })
                ->where('user_id', $user->id)
                ->whereIn('project_user.role_id', [Role::$editor->id, Role::$admin->id])
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
            return DB::table('project_user')
                ->whereIn('project_id', function ($query) use ($volume) {
                    $query->select('project_id')
                        ->from('project_volume')
                        ->where('volume_id', $volume->id);
                })
                ->where('user_id', $user->id)
                ->where('project_user.role_id', Role::$admin->id)
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
}
