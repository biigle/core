<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Shape;

class Annotation
{
    /**
     * @param Shape $shape
     * @param array<float> $points
     * @param array<LabelAndUser> $labels
     */
    public function __construct(
        public Shape $shape,
        public array $points,
        public array $labels,
    ) {
        //
    }
}
