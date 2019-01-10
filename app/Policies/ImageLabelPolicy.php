<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\ImageLabel;
use Illuminate\Auth\Access\HandlesAuthorization;

class ImageLabelPolicy extends CachedPolicy
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
     * Determine if the user can delete the given image label.
     *
     * If the user created the image label, they must be editor or admin of one
     * of the projects, the image belongs to. If another user created it, they must
     * be admin of one of the projects.
     *
     * @param  User  $user
     * @param  ImageLabel  $imageLabel
     * @return bool
     */
    public function destroy(User $user, ImageLabel $imageLabel)
    {
        return $this->remember("image-label-can-destroy-{$user->id}-{$imageLabel->id}", function () use ($user, $imageLabel) {
            // selects the IDs of the projects, the image belongs to
            $projectIdsQuery = function ($query) use ($imageLabel) {
                $query->select('project_volume.project_id')
                    ->from('project_volume')
                    ->join('images', 'project_volume.volume_id', '=', 'images.volume_id')
                    ->where('images.id', $imageLabel->image_id);
            };

            if ((int) $imageLabel->user_id === $user->id) {
                // Editors, experts and admins may detach their own labels.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [
                        Role::editorId(),
                        Role::expertId(),
                        Role::adminId(),
                    ])
                    ->exists();
            } else {
                // Experts and admins may detach labels other than their own.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [Role::expertId(), Role::adminId()])
                    ->exists();
            }
        });
    }
}
