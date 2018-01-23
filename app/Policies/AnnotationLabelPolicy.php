<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\AnnotationLabel;
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
        if ($user->isAdmin) {
            return true;
        }
    }

    /**
     * Determine if the user can edit the given annotation label.
     *
     * @param  User  $user
     * @param  AnnotationLabel  $annotationLabel
     * @return bool
     */
    public function update(User $user, AnnotationLabel $annotationLabel)
    {
        return $this->remember("annotation-label-can-update-{$user->id}-{$annotationLabel->id}", function () use ($user, $annotationLabel) {
            $annotation = $annotationLabel->annotation;

            $query = DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.id', $annotation->project_volume_id);

            if ($annotationLabel->user_id === $user->id) {
                // Editors and admins may update their own labels.
                return $query
                    ->whereIn('project_role_id', [Role::$editor->id, Role::$admin->id])
                    ->exists();
            } else {
                // Only admins may update labels other than their own.
                return $query
                    ->where('project_role_id', Role::$admin->id)
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
