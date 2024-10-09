<?php

namespace Biigle\Services\MetadataParsing;

class ImageAnnotation extends Annotation
{
    /**
     * {@inheritdoc}
     */
    public function getInsertData(int $id): array
    {
        return array_merge(parent::getInsertData($id), [
            'image_id' => $id,
        ]);
    }
}
