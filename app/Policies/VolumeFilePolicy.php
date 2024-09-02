<?php

namespace Biigle\Policies;

use Biigle\Label;
use Biigle\Project;
use Biigle\Role;
use Biigle\User;
use Biigle\VolumeFile;
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
        $except = ['add-annotation', 'attach-label'];

        if ($user->can('sudo') && !in_array($ability, $except)) {
            return true;
        }
    }

    /**
     * Determine if the user can access the given file.
     *
     * @param  User  $user
     * @param  VolumeFile  $file
     * @return bool
     */
    public function access(User $user, VolumeFile $file)
    {
        // put this to permanent cache for rapid querying of file thumbnails
        return Cache::remember("volume-file-can-access-{$user->id}-{$file->volume_id}", 30, fn () => Project::inCommon($user, $file->volume_id)->exists());
    }

    /**
     * Determine if the user can add an annotation to given file.
     *
     * @param  User  $user
     * @param  VolumeFile  $file
     * @return bool
     */
    public function addAnnotation(User $user, VolumeFile $file)
    {
        return $this->remember("volume-file-can-add-annotation-{$user->id}-{$file->volume_id}", function () use ($user, $file) {
            return Project::inCommon($user, $file->volume_id, [
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
     * @param  VolumeFile  $file
     * @return bool
     */
    public function destroy(User $user, VolumeFile $file)
    {
        return $this->remember("volume-file-can-destroy-{$user->id}-{$file->volume_id}", function () use ($user, $file) {
            return Project::inCommon($user, $file->volume_id, [
                Role::adminId(),
            ])->exists();
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
     * @param  VolumeFile  $file
     * @param  Label  $label
     * @return bool
     */
    public function attachLabel(User $user, VolumeFile $file, Label $label)
    {
        return $this->remember("volume-file-can-attach-label-{$user->id}-{$file->volume_id}-{$label->id}", function () use ($user, $file, $label) {
            // Projects, the file belongs to *and* the user is editor, expert or admin
            // of.
            $projectIds = Project::inCommon($user, $file->volume_id, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');

            // User must be editor, expert or admin in one of the projects.
            return $projectIds->isNotEmpty()
                // Label must belong to a label tree that is used by one of the projects.
                && DB::table('label_tree_project')
                    ->whereIn('project_id', $projectIds)
                    ->where('label_tree_id', $label->label_tree_id)
                    ->exists();
        });
    }
}
