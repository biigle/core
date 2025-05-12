<?php

namespace Biigle\Contracts;

use Biigle\Shape;
use Biigle\VolumeFile;

/**
 * An annotation model.
 */
interface Annotation
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
     * Get the image/video, the annotation belongs to.
     *
     * @return VolumeFIle
     */
    public function getFile(): VolumeFile;

    /**
     * Get the ID of the annotation.
     */
    public function getId(): int;
}
