<?php

namespace Biigle\Jobs;

use Biigle\ImageAnnotationLabelFeatureVector;
use Illuminate\Database\Eloquent\Builder;

class CopyImageAnnotationFeatureVector extends CopyAnnotationFeatureVector
{
    /**
     * {@inheritdoc}
     */
    protected function getFeatureVectorQuery(): Builder
    {
        return ImageAnnotationLabelFeatureVector::where('annotation_id', $this->annotationLabel->annotation_id);
    }

    /**
     * {@inheritdoc}
     */
    protected function updateOrCreateFeatureVector(array $attributes): void
    {
        $idArray = ['id' => $attributes['id']];
        unset($attributes['id']);
        ImageAnnotationLabelFeatureVector::updateOrCreate($idArray, $attributes);
    }
}
