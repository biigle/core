<?php

namespace Biigle\Policies;

use Biigle\AnnotationLabel;
use Biigle\Role;
use Biigle\User;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnotationLabelPolicy extends CachedPolicy
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
     * Determine if the user can edit the given annotation label.
     *
     * If the user created the annotation label, they must be editor or admin of one
     * of the projects, the annotation belongs to. If another user created it, they must
     * be admin of one of the projects.
     *
     * @param  User  $user
     * @param  AnnotationLabel  $annotationLabel
     * @return bool
     */
    public function update(User $user, AnnotationLabel $annotationLabel)
    {
        return $this->remember("annotation-label-can-update-{$user->id}-{$annotationLabel->id}", function () use ($user, $annotationLabel) {
            $annotation = $annotationLabel->annotation;
            // selects the IDs of the projects, the annotation belongs to
            $projectIdsQuery = function ($query) use ($annotation) {
                $query->select('project_volume.project_id')
                    ->from('project_volume')
                    ->join('images', 'project_volume.volume_id', '=', 'images.volume_id')
                    ->where('images.id', $annotation->image_id);
            };

            if ((int) $annotationLabel->user_id === $user->id) {
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

    /**
     * Determine if the user can delete the given annotation label.
     *
     * If the user created the annotation label, they must be editor or admin of one
     * of the projects, the annotation belongs to. If another user created it, they must
     * be admin of one of the projects.
     *
     * @param  User  $user
     * @param  AnnotationLabel  $annotationLabel
     * @return bool
     */
    public function destroy(User $user, AnnotationLabel $annotationLabel)
    {
        return $this->update($user, $annotationLabel);
    }
}
