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
        // Same conversion as the Vector cast of the model, which is not applied by
        // upsert().
        $attributes['vector'] = (string) $attributes['vector'];
        VideoAnnotationLabelFeatureVector::upsert(
            [$attributes],
            ['id'],
            ['annotation_id', 'label_id', 'label_tree_id', 'volume_id', 'vector']
        );
    }
}
