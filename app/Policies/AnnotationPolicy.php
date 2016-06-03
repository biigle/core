<?php

namespace Dias\Policies;

use Dias\Annotation;
use Dias\Label;
use Dias\User;
use Dias\Role;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnotationPolicy
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
     * Determine if the user can attach the given label to the given annotation
     *
     * @param  User  $user
     * @param  Annotation  $annotation
     * @param  Label  $label
     * @return bool
     */
    public function attachLabel(User $user, Annotation $annotation, Label $label)
    {
        $projectIds = DB::table('project_transect')
            ->join('images', 'project_transect.transect_id', '=', 'images.transect_id')
            ->where('images.id', $annotation->image_id)
            ->pluck('project_transect.project_id');

        return $user->projects()->whereIn('id', $projectIds)->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id])->exists()
            && DB::table('label_tree_project')->whereIn('project_id', $projectIds)->where('label_tree_id', $label->label_tree_id)->exists();
    }
}
