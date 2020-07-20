<?php

namespace Biigle\Policies;

use Biigle\Video;
use Biigle\VideoAnnotationLabel;

class VideoAnnotationPolicy extends AnnotationPolicy
{
    /**
     * Get the class name of the file model.
     *
     * @return string
     */
    protected function getFileClass()
    {
        return Video::class;
    }

    /**
     * Get the class name of the annotation label model.
     *
     * @return string
     */
    protected function getLabelClass()
    {
        return VideoAnnotationLabel::class;
    }
}
