<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\Label;
use Biigle\Volume;
use Biigle\Annotation;
use Biigle\AnnotationLabel;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnotationPolicy extends CachedPolicy
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
     * Determine if the user may access the given annotation.
     *
     * @param User $user
     * @param Annotation $annotation
     * @return bool
     */
    public function access(User $user, Annotation $annotation)
    {
        return $this->remember("annotation-can-access-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            $volume = Volume::select('volumes.id')
                ->join('images', 'images.volume_id', '=', 'volumes.id')
                ->where('images.id', $annotation->image_id)
                ->first();

            $session = $volume->getActiveAnnotationSession($user);
            $sessionAccess = !$session || $session->allowsAccess($annotation, $user);

            return $sessionAccess &&
                // TODO user must be member of one of the projects, the annotation belongs to
                DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', function ($query) use ($volume) {
                        $query->select('project_id')
                            ->from('project_volume')
                            ->where('volume_id', $volume->id);
                    })
                    ->exists();
        });
    }

    /**
     * Determine if the user may update the given annotation.
     *
     * @param User $user
     * @param Annotation $annotation
     * @return bool
     */
    public function update(User $user, Annotation $annotation)
    {
        return $this->remember("annotation-can-update-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {

            // User must be editor or admin of the project to which the annotation
            // belongs.
            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id])
                ->where('project_volume.id', $annotation->project_volume_id)
                ->exists();
        });
    }

    /**
     * Determine if the user can attach the given label to the given annotation.
     *
     * The annototation must belong to a project where the user is an editor or
     * admin. The label must belong to a label tree that is used by the project
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

            return DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->join('label_tree_project', 'label_tree_project.project_id', '=', 'project_user.project_id')
                // User must be editor or admin of the project to which the annotation
                // belongs.
                ->where('project_user.user_id', $user->id)
                ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id])
                ->where('project_volume.id', $annotation->project_volume_id)
                // The label must belong to one of the label trees that are attached
                // to the project to which the annotation belongs.
                ->where('label_tree_project.label_tree_id', $label->label_tree_id)
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
            // Check if there are labels of other users attached to this annotation.
            // This also handles the case correctly when *no* label is attached because
            // in this case editors and admins are allowed to delete the annotation.
            $hasLabelsFromOthers = AnnotationLabel::where('annotation_id', $annotation->id)
                ->where('user_id', '!=', $user->id)
                ->exists();

            $query = DB::table('project_user')
                ->join('project_volume', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('project_volume.id', $annotation->project_volume_id);

            if ($hasLabelsFromOthers) {
                // Only project admins may delete annotations to which labels of other
                // users are still attached.
                return $query
                    ->where('project_role_id', Role::$admin->id)
                    ->exists();
            } else {
                // Editors may delete only those annotations that have their own label
                // attached as only label.
                return $query
                    ->whereIn('project_role_id', [Role::$editor->id, Role::$admin->id])
                    ->exists();
            }
        });
    }
}
