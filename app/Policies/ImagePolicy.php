<?php

namespace Biigle\Policies;

use Biigle\Image;
use Biigle\Label;
use Biigle\User;

class ImagePolicy extends VolumeFilePolicy
{
    /**
     * Determine if the user can access the given image.
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function access(User $user, Image $image)
    {
        return $this->accessFile($user, $image->volume_id);
    }

    /**
     * Determine if the user can add an annotation to the given image.
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function addAnnotation(User $user, Image $image)
    {
        return $this->addAnnotationToFile($user, $image->volume_id);
    }

    /**
     * Determine if the user can delete the given image.
     *
     * @param  User  $user
     * @param  Image  $image
     * @return bool
     */
    public function destroy(User $user, Image $image)
    {
        return $this->destroyFile($user, $image->volume_id);
    }

    /**
     * Determine if the user can attach the given label to the given image.
     *
     * The image must belong to a project where the user is an editor or
     * admin. The label must belong to a label tree that is used by one of the projects
     * the user and the image belong to.
     *
     * @param  User  $user
     * @param  Image  $image
     * @param  Label  $label
     * @return bool
     */
    public function attachLabel(User $user, Image $image, Label $label)
    {
        return $this->attachLabelToFile($user, $image->volume_id, $label);
    }
}
