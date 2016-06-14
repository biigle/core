<?php

namespace Dias\Policies;

use Dias\Annotation;
use Dias\AnnotationLabel;
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

    /**
     * Determine if the user may delete the given annotation.
     *
     * @param User $user
     * @param Annotation $annotation
     * @return bool
     */
    public function destroy(User $user, Annotation $annotation)
    {
        return $this->remember("annotation-can-destroy-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            // selects the IDs of the projects, the annotation belongs to
            $projectIdsQuery = function ($query) use ($annotation) {
                $query->select('project_transect.project_id')
                    ->from('project_transect')
                    ->join('images', 'project_transect.transect_id', '=', 'images.transect_id')
                    ->where('images.id', $annotation->image_id);
            };

            // check if there are labels of other users attached to this annotation
            // this also handles the case correctly when *no* label is attached
            $hasLabelsFromOthers = AnnotationLabel::where('annotation_id', $annotation->id)
                ->where('user_id', '!=', $user->id)
                ->exists();

            if ($hasLabelsFromOthers) {
                // only project admins may delete annotations where labels of other users
                // are still attached to
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->where('project_role_id', Role::$admin->id)
                    ->exists();
            } else {
                // editors may delete only those annotations that have their own label
                // attached as only label
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [Role::$editor->id, Role::$admin->id])
                    ->exists();
            }
        });
    }
}
