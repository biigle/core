<?php

namespace Biigle\Policies;

use Biigle\Policies\CachedPolicy;
use Biigle\Role;
use Biigle\User;
use Biigle\VideoAnnotationLabel;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class VideoAnnotationLabelPolicy extends CachedPolicy
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
     * Determine if the user may detach the given video annotation label.
     *
     * @param User $user
     * @param VideoAnnotationLabel $annotationLabel
     * @return bool
     */
    public function destroy(User $user, VideoAnnotationLabel $annotationLabel)
    {
        return $this->remember("video-annotation-label-can-destroy-{$user->id}-{$annotationLabel->id}", function () use ($user, $annotationLabel) {
            // Selects the ID of the projects to which the annotation belongs.
            $projectIdsQuery = function ($query) use ($annotationLabel) {
                $query->select('videos.project_id')
                    ->from('videos')
                    ->join('video_annotations', 'video_annotations.video_id', '=', 'videos.id')
                    ->where('video_annotations.id', $annotationLabel->video_annotation_id);
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
}
