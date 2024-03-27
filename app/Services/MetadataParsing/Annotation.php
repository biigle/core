<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Shape;
use Biigle\Traits\HasPointsAttribute;
use Exception;

class Annotation
{
    use HasPointsAttribute;

    /**
     * Shape ID required for point validation.
     */
    public int $shape_id;

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
        $this->shape_id = $shape->id;
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

    /**
     * Validatethe points and labels.
     *
     * @throws Exception If something is invalid.
     */
    public function validate(): void
    {
        if (empty($this->labels)) {
            throw new Exception('The annotation has no labels.');
        }

        $this->validatePoints($this->points);
    }
}
