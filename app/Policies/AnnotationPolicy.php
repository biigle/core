<?php

namespace Dias\Policies;

use Dias\Annotation;
use Dias\Label;
use Dias\User;
use Dias\Role;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnotationPolicy extends CachedPolicy
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
     * Determine if the user can attach the given label to the given annotation.
     *
     * The annototation (image) must belong to a project where the user is an editor or
     * admin. The label must belong to a label tree that is used by one of the projects
     * the user and the annotation belong to.
     *
     * @param  User  $user
     * @param  Annotation  $annotation
     * @param  Label  $label
     * @return bool
     */
    public function attachLabel(User $user, Annotation $annotation, Label $label)
    {
        return $this->remember("annotation-can-attach-label-{$user->id}-{$annotation->id}-{$label->id}", function () use ($user, $annotation, $label) {
            // projects, the annotation belongs to *and* the user is editor or admin of
            $projectIds = DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($annotation) {
                    // the projects, the annotation belongs to
                    $query->select('project_transect.project_id')
                        ->from('project_transect')
                        ->join('images', 'project_transect.transect_id', '=', 'images.transect_id')
                        ->where('images.id', $annotation->image_id);
                })
                ->whereIn('project_role_id', [Role::$editor->id, Role::$admin->id])
                ->pluck('project_id');

            // user must be editor or admin in one of the projects
            return !empty($projectIds)
                // label must belong to a label tree that is used by one of the projects
                && DB::table('label_tree_project')
                    ->whereIn('project_id', $projectIds)
                    ->where('label_tree_id', $label->label_tree_id)
                    ->exists();
        });
    }
}
