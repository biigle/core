<?php

namespace Biigle\Contracts;

use Biigle\Image;
use Biigle\Shape;
use Illuminate\Contracts\Queue\QueueableEntity;

/**
 * An annotation model.
 */
interface Annotation extends QueueableEntity
{
    /**
     * Get the points array of the annotation.
     *
     * @return array
     */
    public function getPoints(): array;

    /**
     * Get the shape of an annotation.
     *
     * @return Shape
     */
    public function getShape(): Shape;

    /**
     * Get the image, the annotation belongs to.
     *
     * @return Image
     */
    public function getImage(): Image;
}
