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
        // Same conversion as the Vector cast of the model, which is not applied by
        // upsert().
        $attributes['vector'] = (string) $attributes['vector'];
        ImageAnnotationLabelFeatureVector::upsert(
            [$attributes],
            ['id'],
            ['annotation_id', 'label_id', 'label_tree_id', 'volume_id', 'vector']
        );
    }
}
