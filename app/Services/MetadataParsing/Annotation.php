<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Shape;
use Biigle\Traits\HasPointsAttribute;
use Exception;

// Abstract becaus it should not be used directly.
abstract class Annotation
{
    use HasPointsAttribute;

    /**
     * Shape ID required for point validation.
     */
    public int $shape_id;

    /**
     * @param Shape $shape
     * @param array<float>|array<array<float>> $points
     * @param array<LabelAndUser> $labels
     */
    public function __construct(
        public Shape $shape,
        public array $points,
        public array $labels,
    ) {
        $this->shape_id = $shape->id;
        $this->setPointsAttribute($points);

        array_walk($labels, function ($label) {
            /** @phpstan-ignore instanceof.alwaysTrue */
            if (!($label instanceof LabelAndUser)) {
                throw new Exception('Annotation labels must be of class '.LabelAndUser::class);
            }
        });
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

    /**
     * {@inheritdoc}
     */
    public function setPointsAttribute(array $points)
    {
        $this->points = $this->normalizePoints($points);
    }

    /**
     * Normalize point coordinates by rounding numeric values while preserving invalid
     * values so validation can report the intended error messages.
     */
    private function normalizePoints(array $points): array
    {
        return array_map(function ($value) {
            if (is_array($value)) {
                return $this->normalizePoints($value);
            }

            if (is_int($value) || is_float($value)) {
                return round($value, 2);
            }

            return $value;
        }, $points);
    }
}
