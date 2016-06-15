<?php

namespace Dias\Policies;

use Dias\Image;
use Dias\User;
use Dias\Role;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class ImagePolicy extends CachedPolicy
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
     * Determine if the user can access the given image
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function access(User $user, Image $image)
    {
        // put this to permanent cache for rapid querying of image thumbnails
        return Cache::remember("image-can-access-{$user->id}-{$image->transect_id}", 0.5, function () use ($user, $image) {
            // check if user is member of one of the projects, the image belongs to
            return DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($image) {
                    // the projects, the image belongs to
                    $query->select('project_id')
                        ->from('project_transect')
                        ->where('transect_id', $image->transect_id);
                })
                ->exists();
        });
    }

    /**
     * Determine if the user can add an annotation to given image
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function addAnnotation(User $user, Image $image)
    {
        return $this->remember("image-can-add-annotation-{$user->id}-{$image->id}", function () use ($user, $image) {
            // check if user is member of one of the projects, the image belongs to
            return DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($image) {
                    // the projects, the image belongs to
                    $query->select('project_id')
                        ->from('project_transect')
                        ->where('transect_id', $image->transect_id);
                })
                ->whereIn('project_role_id', [Role::$editor->id, Role::$admin->id])
                ->exists();
        });
    }

    /**
     * Determine if the user can delete the given image
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function destroy(User $user, Image $image)
    {
        return $this->remember("image-can-destroy-{$user->id}-{$image->id}", function () use ($user, $image) {
            // check if user is member of one of the projects, the image belongs to
            return DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($image) {
                    // the projects, the image belongs to
                    $query->select('project_id')
                        ->from('project_transect')
                        ->where('transect_id', $image->transect_id);
                })
                ->where('project_role_id', Role::$admin->id)
                ->exists();
        });
    }
}
