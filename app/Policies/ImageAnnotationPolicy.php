<?php

namespace Biigle\Policies;

use Biigle\Image;
use Biigle\ImageAnnotationLabel;

class ImageAnnotationPolicy extends AnnotationPolicy
{
    /**
     * Get the class name of the file model.
     *
     * @return string
     */
    protected function getFileClass()
    {
        return Image::class;
    }

    /**
     * Get the class name of the annotation label model.
     *
     * @return string
     */
    protected function getLabelClass()
    {
        return ImageAnnotationLabel::class;
    }
}
