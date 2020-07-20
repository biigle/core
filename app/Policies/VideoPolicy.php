<?php

namespace Biigle\Policies;

use Biigle\Video;
use Biigle\Label;
use Biigle\User;

class VideoPolicy extends VolumeFilePolicy
{
    /**
     * Determine if the user can access the given video.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function access(User $user, Video $video)
    {
        return $this->accessFile($user, $video->volume_id);
    }

    /**
     * Determine if the user can add an annotation to the given video.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function addAnnotation(User $user, Video $video)
    {
        return $this->addAnnotationToFile($user, $video->volume_id);
    }

    /**
     * Determine if the user can delete the given video.
     *
     * @param  User  $user
     * @param  Video  $video
     * @return bool
     */
    public function destroy(User $user, Video $video)
    {
        return $this->destroyFile($user, $video->volume_id);
    }
}
