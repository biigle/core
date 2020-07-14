<?php

namespace Biigle\Policies;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Label;
use Biigle\Role;
use Biigle\User;
use Biigle\Volume;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class ImageAnnotationPolicy extends CachedPolicy
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
     * Determine if the user may access the given annotation.
     *
     * @param User $user
     * @param ImageAnnotation $annotation
     * @return bool
     */
    public function access(User $user, ImageAnnotation $annotation)
    {
        return $this->remember("annotation-can-access-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            $volume = Volume::select('volumes.id')
                ->join('images', 'images.volume_id', '=', 'volumes.id')
                ->where('images.id', $annotation->image_id)
                ->first();

            $session = $volume->getActiveAnnotationSession($user);
            $sessionAccess = !$session || $session->allowsAccess($annotation, $user);

            return $sessionAccess &&
                // user must be member of one of the projects, the annotation belongs to
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
     * @param ImageAnnotation $annotation
     * @return bool
     */
    public function update(User $user, ImageAnnotation $annotation)
    {
        return $this->remember("annotation-can-update-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            // user must be member of one of the projects, the annotation belongs to
            return DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($annotation) {
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join('images', 'project_volume.volume_id', '=', 'images.volume_id')
                        ->where('images.id', $annotation->image_id);
                })
                ->whereIn('project_role_id', [
                    Role::editorId(),
                    Role::expertId(),
                    Role::adminId(),
                ])
                ->exists();
        });
    }

    /**
     * Determine if the user can attach the given label to the given annotation.
     *
     * The annototation (image) must belong to a project where the user is an editor or
     * admin. The label must belong to a label tree that is used by one of the projects
     * the user and the annotation belong to.
     *
     * @param  User  $user
     * @param  ImageAnnotation  $annotation
     * @param  Label  $label
     * @return bool
     */
    public function attachLabel(User $user, ImageAnnotation $annotation, Label $label)
    {
        return $this->remember("annotation-can-attach-label-{$user->id}-{$annotation->id}-{$label->id}", function () use ($user, $annotation, $label) {
            // Projects, the annotation belongs to *and* the user is editor, expert or admin of.
            $projectIds = DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($annotation) {
                    // the projects, the annotation belongs to
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join('images', 'project_volume.volume_id', '=', 'images.volume_id')
                        ->where('images.id', $annotation->image_id);
                })
                ->whereIn('project_role_id', [
                    Role::editorId(),
                    Role::expertId(),
                    Role::adminId(),
                ])
                ->pluck('project_id');

            // User must be editor, expert or admin in one of the projects.
            return !empty($projectIds)
                // Label must belong to a label tree that is used by one of the projects.
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
     * @param ImageAnnotation $annotation
     * @return bool
     */
    public function destroy(User $user, ImageAnnotation $annotation)
    {
        return $this->remember("annotation-can-destroy-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            // selects the IDs of the projects, the annotation belongs to
            $projectIdsQuery = function ($query) use ($annotation) {
                $query->select('project_volume.project_id')
                    ->from('project_volume')
                    ->join('images', 'project_volume.volume_id', '=', 'images.volume_id')
                    ->where('images.id', $annotation->image_id);
            };

            // check if there are labels of other users attached to this annotation
            // this also handles the case correctly when *no* label is attached
            $hasLabelsFromOthers = ImageAnnotationLabel::where('annotation_id', $annotation->id)
                ->where('user_id', '!=', $user->id)
                ->exists();

            if ($hasLabelsFromOthers) {
                // Experts and admins may delete annotations where labels of other users
                // are still attached to.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [Role::expertId(), Role::adminId()])
                    ->exists();
            } else {
                // Editors may delete only those annotations that have their own label
                // attached as only label.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [
                        Role::editorId(),
                        Role::expertId(),
                        Role::adminId(),
                    ])
                    ->exists();
            }
        });
    }
}
