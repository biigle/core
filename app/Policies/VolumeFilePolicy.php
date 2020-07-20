<?php

namespace Biigle\Policies;

use Biigle\Label;
use Biigle\Project;
use Biigle\Role;
use Biigle\User;
use Cache;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class VolumeFilePolicy extends CachedPolicy
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
     * Determine if the user can access the given file.
     *
     * @param  User  $user
     * @param  int  $volumeId
     * @return bool
     */
    public function accessFile(User $user, $volumeId)
    {
        // put this to permanent cache for rapid querying of file thumbnails
        return Cache::remember("volume-file-can-access-{$user->id}-{$volumeId}", 30, function () use ($user, $volumeId) {
            return Project::inCommon($user, $volumeId)->exists();
        });
    }

    /**
     * Determine if the user can add an annotation to given file.
     *
     * @param  User  $user
     * @param  int  $volumeId
     * @return bool
     */
    public function addAnnotationToFile(User $user, $volumeId)
    {
        return $this->remember("volume-file-can-add-annotation-{$user->id}-{$volumeId}", function () use ($user, $volumeId) {
            return Project::inCommon($user, $volumeId, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->exists();
        });
    }

    /**
     * Determine if the user can delete the given file.
     *
     * @param  User  $user
     * @param  int  $volumeId
     * @return bool
     */
    public function destroyFile(User $user, $volumeId)
    {
        return $this->remember("volume-file-can-destroy-{$user->id}-{$volumeId}", function () use ($user, $volumeId) {
            return Project::inCommon($user, $volumeId, [Role::adminId()])->exists();
        });
    }

    /**
     * Determine if the user can attach the given label to the given file.
     *
     * The file must belong to a project where the user is an editor or
     * admin. The label must belong to a label tree that is used by one of the projects
     * the user and the file belong to.
     *
     * @param  User  $user
     * @param  int  $volumeId
     * @param  Label  $label
     * @return bool
     */
    public function attachLabelToFile(User $user, $volumeId, Label $label)
    {
        return $this->remember("volume-file-can-attach-label-{$user->id}-{$volumeId}-{$label->id}", function () use ($user, $volumeId, $label) {
            // Projects, the file belongs to *and* the user is editor, expert or admin
            // of.
            $projectIds = Project::inCommon($user, $volumeId, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');

            // User must be editor, expert or admin in one of the projects.
            return !empty($projectIds)
                // Label must belong to a label tree that is used by one of the projects.
                && DB::table('label_tree_project')
                    ->whereIn('project_id', $projectIds)
                    ->where('label_tree_id', $label->label_tree_id)
                    ->exists();
        });
    }
}
