<?php

namespace Biigle\Policies;

use DB;
use Cache;
use Biigle\User;
use Biigle\Role;
use Biigle\Volume;
use Biigle\Visibility;
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
            // Every user may access apublic volume.
            return $volume->visibility_id === Visibility::$public->id
                // Private volumes may be accessed by members...
                || $volume->members()
                    ->where('id', $user->id)
                    ->exists()
                // ...or by members of projects to which the volume is attached.
                || DB::table('project_user')
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
     * Determine if the user can edit something in the given volume through the given
     * project.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @param int $pid Project ID
     * @return bool
     */
    public function editThroughProject(User $user, Volume $volume, $pid)
    {
        return $this->remember("volume-can-edit-through-project-{$user->id}-{$volume->id}-{$pid}", function () use ($user, $volume, $pid) {
            // Editors and admins of the project are able to edit in the volume if the
            // volume is attached to the project.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.volume_id', $volume->id)
                ->where('project_volume.project_id', $pid)
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
            return $volume->members()
                ->where('id', $user->id)
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
     * Determine if the user can add members to the given volume.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function addMember(User $user, Volume $volume)
    {
        return $this->update($user, $volume);
    }

    /**
     * Determine if the user can remove members from the given volume.
     *
     * @param  User  $user
     * @param  Volume  $volume
     * @return bool
     */
    public function removeMember(User $user, Volume $volume)
    {
        return $this->update($user, $volume);
    }
}
