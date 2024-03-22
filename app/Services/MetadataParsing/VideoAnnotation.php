<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Shape;

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
        //
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
}
