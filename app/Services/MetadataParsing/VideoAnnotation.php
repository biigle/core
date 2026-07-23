<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Shape;
use Biigle\Traits\ValidatesVideoAnnotationPoints;
use Exception;

class VideoAnnotation extends Annotation
{
    use ValidatesVideoAnnotationPoints;

    /**
     * @param Shape $shape
     * @param array<array<float>> $points
     * @param array<LabelAndUser> $labels
     * @param array<int|float|null> $frames
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
            /** @phpstan-ignore booleanAnd.alwaysFalse, function.alreadyNarrowedType */
            if (!is_null($frame) && !is_numeric($frame)) {
                throw new Exception("Video annotation frames must be numbers, got '{$frame}'.");
            }
        }
    }
}
