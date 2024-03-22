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

    /**
     * Get the array of metadata that can be used for Model::insert();
     *
     * @param int $id ID of the image/video database model.
     */
    public function getInsertData(int $id): array
    {
        return [
            'points' => json_encode($this->points),
            'shape_id' => $this->shape->id,
        ];
    }
}
