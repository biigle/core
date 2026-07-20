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
     * @param array<float|null> $frames
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
            // null is allowed because it represents a gap in the annotation. Where gaps
            // are allowed is checked in validatePoints().
            /** @phpstan-ignore function.alreadyNarrowedType */
            if (!is_null($frame) && !is_numeric($frame)) {
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

        // Use a local variable because end() takes a reference.
        $points = $this->points;

        if (count($points) !== count($this->frames)) {
            throw new Exception('The number of key frames does not match the number of annotation coordinates.');
        }

        // Gaps are represented as empty arrays. This also catches the all-empty case.
        if (empty($points[0]) || empty(end($points))) {
            throw new Exception('An annotation must not start or end with a gap.');
        }

        foreach ($points as $index => $point) {
            // Unlike the annotations of the API requests, these are not validated by a
            // form request, so the array structure must be checked here.
            if (!is_array($point)) {
                throw new Exception('The annotation points must be an array of arrays of numbers.');
            }

            $isGap = empty($point);

            if ($isGap !== is_null($this->frames[$index])) {
                throw new Exception('A gap must have empty points and no key frame time.');
            }

            // Gaps have no coordinates that could be validated.
            if (!$isGap) {
                parent::validatePoints($point);
            }
        }
    }
}
