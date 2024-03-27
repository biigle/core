<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Shape;
use Exception;

class VideoAnnotation extends Annotation
{
    /**
     * @param Shape $shape
     * @param array<array<float>> $points
     * @param array<LabelAndUser> $labels
     * @param array<float> $frames
     */
    public function __construct(
        public Shape $shape,
        public array $points,
        public array $labels,
        public array $frames,
    ) {
        parent::__construct($shape, $points, $labels);
    }

    /**
     * {@inheritdoc}
     */
    public function getInsertData(int $id): array
    {
        return array_merge(parent::getInsertData($id), [
            'video_id' => $id,
            'frames' => json_encode($this->frames),
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function validate(): void
    {
        parent::validate();

        foreach ($this->frames as $frame) {
            if (!is_float($frame) && !is_int($frame)) {
                throw new Exception("Video annotation frames must be numbers, got '{$frame}'.");
            }
        }
    }

    /**
     * Similar to \Biigle\VideoAnnotation::validatePoints.
     */
    public function validatePoints(array $points = []): void
    {
        if ($this->shape_id === Shape::wholeFrameId()) {
            if (count($this->points) !== 0) {
                throw new Exception('Whole frame annotations cannot have point coordinates.');
            }

            return;
        }

        if (count($this->points) !== count($this->frames)) {
            throw new Exception('The number of key frames does not match the number of annotation coordinates.');
        }

        // Gaps are represented as empty arrays
        array_map(function ($point) {
            if (count($point)) {
                parent::validatePoints($point);
            }
        }, $this->points);
    }
}
