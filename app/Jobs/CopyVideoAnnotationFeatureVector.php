<?php

namespace Biigle\Jobs;

use Biigle\VideoAnnotationLabelFeatureVector;
use Illuminate\Database\Eloquent\Builder;

class CopyVideoAnnotationFeatureVector extends CopyAnnotationFeatureVector
{
    /**
     * {@inheritdoc}
     */
    protected function getFeatureVectorQuery(): Builder
    {
        return VideoAnnotationLabelFeatureVector::where('annotation_id', $this->annotationLabel->annotation_id);
    }

    /**
     * {@inheritdoc}
     */
    protected function updateOrCreateFeatureVector(array $attributes): void
    {
        $idArray = ['id' => $attributes['id']];
        unset($attributes['id']);
        VideoAnnotationLabelFeatureVector::updateOrCreate($idArray, $attributes);
    }
}
