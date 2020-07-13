<?php

namespace Biigle\Policies;

use Biigle\Label;
use Biigle\Policies\CachedPolicy;
use Biigle\Role;
use Biigle\User;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class VideoAnnotationPolicy extends CachedPolicy
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
     * @param VideoAnnotation $annotation
     * @return bool
     */
    public function access(User $user, VideoAnnotation $annotation)
    {
        return $this->remember("video-annotation-can-access-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            return DB::table('project_user')
                    ->join('videos', 'videos.project_id', '=', 'project_user.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('videos.id', $annotation->video_id)
                    ->exists();
        });
    }

    /**
     * Determine if the user may update the given annotation.
     *
     * @param User $user
     * @param VideoAnnotation $annotation
     * @return bool
     */
    public function update(User $user, VideoAnnotation $annotation)
    {
        return $this->remember("video-annotation-can-update-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            return DB::table('project_user')
                    ->join('videos', 'videos.project_id', '=', 'project_user.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('videos.id', $annotation->video_id)
                    ->whereIn('project_user.project_role_id', [
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
     * @param  VideoAnnotation  $annotation
     * @param  Label  $label
     * @return bool
     */
    public function attachLabel(User $user, VideoAnnotation $annotation, Label $label)
    {
        return $this->remember("video-annotation-can-attach-label-{$user->id}-{$annotation->id}-{$label->id}", function () use ($user, $annotation, $label) {
            // Projects, the annotation belongs to *and* the user is editor, expert or admin of.
            $projectIds = DB::table('project_user')
                    ->join('videos', 'videos.project_id', '=', 'project_user.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('videos.id', $annotation->video_id)
                    ->whereIn('project_user.project_role_id', [
                        Role::editorId(),
                        Role::expertId(),
                        Role::adminId(),
                    ])
                    ->pluck('project_user.project_id');

            // User must be editor, expert or admin in one of the projects.
            return $projectIds->isNotEmpty()
                // Label must belong to a label tree that is used by one of the projects.
                && DB::table('label_tree_project')
                    ->where('project_id', $projectIds->first())
                    ->where('label_tree_id', $label->label_tree_id)
                    ->exists();
        });
    }

    /**
     * Determine if the user may delete the given annotation.
     *
     * @param User $user
     * @param VideoAnnotation $annotation
     * @return bool
     */
    public function destroy(User $user, VideoAnnotation $annotation)
    {
        return $this->remember("video-annotation-can-destroy-{$user->id}-{$annotation->id}", function () use ($user, $annotation) {
            $hasLabelsFromOthers = VideoAnnotationLabel::where('video_annotation_id', $annotation->id)
                ->where('user_id', '!=', $user->id)
                ->exists();

            if ($hasLabelsFromOthers) {
                $requiredRoles = [
                    Role::expertId(),
                    Role::adminId(),
                ];
            } else {
                $requiredRoles = [
                    Role::editorId(),
                    Role::expertId(),
                    Role::adminId(),
                ];
            }

            return DB::table('project_user')
                ->join('videos', 'videos.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                ->where('videos.id', $annotation->video_id)
                ->whereIn('project_role_id', $requiredRoles)
                ->exists();
        });
    }
}
