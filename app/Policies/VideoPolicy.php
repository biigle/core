<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\Video;
use Biigle\Policies\CachedPolicy;
use Illuminate\Auth\Access\HandlesAuthorization;

class VideoPolicy extends CachedPolicy
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
     * Determine if the given video can be accessed by the user.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function access(User $user, Video $video)
    {
        return $this->remember("video-can-access-{$user->id}-{$video->id}", function () use ($user, $video) {
            return $this->getBaseQuery($user, $video)->exists();
        });
    }

    /**
     * Determine if the user can edit something in the given video.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function editIn(User $user, Video $video)
    {
        return $this->remember("video-can-edit-in-{$user->id}-{$video->id}", function () use ($user, $video) {
            return $this->getBaseQuery($user, $video)
                ->whereIn('project_role_id', [
                    Role::editorId(),
                    Role::expertId(),
                    Role::adminId(),
                ])
                ->exists();
        });
    }

    /**
     * Determine if the user can edit things created by other users in the given video.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function forceEditIn(User $user, Video $video)
    {
        return $this->remember("video-can-force-edit-in-{$user->id}-{$video->id}", function () use ($user, $video) {
            return $this->getBaseQuery($user, $video)
                ->whereIn('project_role_id', [Role::expertId(), Role::adminId()])
                ->exists();
        });
    }

    /**
     * Determine if the given video can be updated by the user.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function update(User $user, Video $video)
    {
        return $this->remember("video-can-update-{$user->id}-{$video->id}", function () use ($user, $video) {
            return $this->getBaseQuery($user, $video)
                ->where('project_role_id', Role::adminId())
                ->exists();
        });
    }

    /**
     * Determine if the given video can be deleted by the user.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function destroy(User $user, Video $video)
    {
        return $this->update($user, $video);
    }

    /**
     * Get the base query for all policy methods.
     *
     * @param User $user
     * @param Video $video
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function getBaseQuery(User $user, Video $video)
    {
        return DB::table('project_user')
            ->where('project_id', $video->project_id)
            ->where('user_id', $user->id);
    }
}
