<?php

namespace Biigle\Policies;

use DB;
use Cache;
use Biigle\User;
use Biigle\Role;
use Biigle\Image;
use Biigle\Label;
use Biigle\ProjectVolume;
use Illuminate\Auth\Access\HandlesAuthorization;

class ImagePolicy extends CachedPolicy
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
     * Determine if the user can access the given image.
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function access(User $user, Image $image)
    {
        // Put this to permanent cache for rapid querying of image thumbnails or
        // annotations.
        return Cache::remember("image-can-access-{$user->id}-{$image->volume_id}", 0.5, function () use ($user, $image) {
            // TODO This is the implicit image access through project membership.
            // Add the explicit access through volume membership.

            // Check if user is member of one of the projects, the image belongs to.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.volume_id', $image->volume_id)
                ->exists();
        });
    }

    /**
     * Determine if the user can access the given image through the given project.
     *
     * @param  User  $user
     * @param  Image  $image
     * @param  int  $pid Project ID
     * @return bool
     */
    public function accessThroughProject(User $user, Image $image, $pid)
    {
        // Put this to permanent cache for rapid querying of image thumbnails or
        // annotations.
        return Cache::remember("image-can-access-through-project-{$user->id}-{$image->volume_id}-{$pid}", 0.5, function () use ($user, $image, $pid) {

            // Check if user is member of one of the projects, the image belongs to.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.volume_id', $image->volume_id)
                ->where('project_volume.project_id', $pid)
                ->exists();
        });
    }

    /**
     * Determine if the user can add an annotation via the given project volume
     * to given image.
     *
     * @param  User  $user
     * @param  Image  $image
     * @param ProjectVolume $pivot
     * @return bool
     */
    public function addAnnotation(User $user, Image $image, ProjectVolume $pivot)
    {
        return $this->remember("image-can-add-annotation-{$user->id}-{$image->id}-{$pivot->id}", function () use ($user, $image, $pivot) {
            // Check if user is member of the project, the image belongs to via the
            // project volume.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id])
                ->where('project_volume.volume_id', $image->volume_id)
                ->where('project_volume.id', $pivot->id)
                ->exists();
        });
    }

    /**
     * Determine if the user can delete the given image.
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function destroy(User $user, Image $image)
    {
        return $this->remember("image-can-destroy-{$user->id}-{$image->id}", function () use ($user, $image) {
            // Check if user is member of one of the projects, the image belongs to.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_user.project_role_id', Role::$admin->id)
                ->where('project_volume.volume_id', $image->volume_id)
                ->exists();
        });
    }

    /**
     * Determine if the user can attach the given label to the given image.
     *
     * @param  User  $user
     * @param  Image  $image
     * @param  Label  $label
     * @param ProjectVolume $pivot
     * @return bool
     */
    public function attachLabel(User $user, Image $image, Label $label, ProjectVolume $pivot)
    {
        return $this->remember("image-can-attach-label-{$user->id}-{$image->id}-{$label->id}-{$pivot->id}", function () use ($user, $image, $label, $pivot) {
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->join('label_tree_project', 'label_tree_project.project_id', '=', 'project_user.project_id')
                // User must be editor or admin of the project to which the new image
                // label should belong to.
                ->where('project_user.user_id', $user->id)
                ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id])
                ->where('project_volume.id', $pivot->id)
                ->where('project_volume.volume_id', $image->volume_id)
                // The label must belong to one of the label trees that are attached
                // to the project to which the annotation belongs.
                ->where('label_tree_project.label_tree_id', $label->label_tree_id)
                ->exists();
        });
    }
}
