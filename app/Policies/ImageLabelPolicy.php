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
        if ($user->isAdmin) {
            return true;
        }
    }

    /**
     * Determine if the user can delete the given image label.
     *
     * @param  User  $user
     * @param  ImageLabel  $imageLabel
     * @return bool
     */
    public function destroy(User $user, ImageLabel $imageLabel)
    {
        return $this->remember("image-label-can-destroy-{$user->id}-{$imageLabel->id}", function () use ($user, $imageLabel) {
            $query = DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.id', $imageLabel->project_volume_id);

            if ($imageLabel->user_id === $user->id) {
                // Editors and admins may detach their own labels.
                return $query
                    ->whereIn('project_user.role_id', [Role::$editor->id, Role::$admin->id])
                    ->exists();
            } else {
                // Only admins may detach labels other than their own.
                return $query
                    ->where('project_user.role_id', Role::$admin->id)
                    ->exists();
            }
        });
    }
}
