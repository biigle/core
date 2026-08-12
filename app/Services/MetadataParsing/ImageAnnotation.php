<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\Rules\AnnotationPoints;
use Exception;

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

    /**
     * {@inheritdoc}
     */
    public function validate(): void
    {
        parent::validate();

        $message = (new AnnotationPoints($this->shape_id))->getErrorMessage($this->points);

        if (!is_null($message)) {
            throw new Exception($message);
        }
    }
}
