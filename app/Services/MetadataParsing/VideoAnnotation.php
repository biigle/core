<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Shape;

class VideoAnnotation extends Annotation
{
    /**
     * @param Shape $shape
     * @param array<array<float>> $points
     * @param array<LabelAndAnnotator> $labels
     * @param array<float> $frames
     */
    public function __construct(
        public Shape $shape,
        public array $points,
        public array $labels,
        public array $frames,
    ) {
        //
    }
}
