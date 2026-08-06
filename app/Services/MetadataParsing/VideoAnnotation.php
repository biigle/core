<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Rules\VideoAnnotationFrames;
use Biigle\Rules\VideoAnnotationGaps;
use Biigle\Rules\VideoAnnotationPoints;
use Biigle\Shape;
use Exception;

class VideoAnnotation extends Annotation
{
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

        $message = (new VideoAnnotationPoints($this->shape_id))->getErrorMessage($this->points);

        // The duration is not known at this point, so the frame times are not checked
        // against it.
        $message ??= (new VideoAnnotationFrames())->getErrorMessage($this->frames);

        // Whole frame annotations have no points, so there are no gaps to check.
        if ($this->shape_id !== Shape::wholeFrameId()) {
            $message ??= (new VideoAnnotationGaps($this->frames))->getErrorMessage($this->points);
        }

        if (!is_null($message)) {
            throw new Exception($message);
        }
    }
}
