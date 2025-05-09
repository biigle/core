<?php

namespace Biigle\Jobs;

use Biigle\AnnotationLabel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

abstract class CopyAnnotationFeatureVector extends Job
{
    use SerializesModels, InteractsWithQueue;

    /**
     * Ignore this job if the annotation does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Copy the feature vector of the annotation associated with the annotation label
     * to create a new feature vector for the annotation label.
     */
    public function __construct(public AnnotationLabel $annotationLabel)
    {
        //
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $vector = $this->getFeatureVectorQuery()->first();
        if (!is_null($vector)) {
            $this->updateOrCreateFeatureVector([
                'id' => $this->annotationLabel->id,
                'annotation_id' => $this->annotationLabel->annotation_id,
                'label_id' => $this->annotationLabel->label_id,
                'label_tree_id' => $this->annotationLabel->label->label_tree_id,
                'volume_id' => $vector->volume_id,
                'vector' => $vector->vector,
            ]);
        }
    }

    /**
     * Get a query for the feature vectors associated with the annotation of this job.
     *
     * @return Builder<\Biigle\ImageAnnotationLabelFeatureVector>|Builder<\Biigle\VideoAnnotationLabelFeatureVector>
     */
    abstract protected function getFeatureVectorQuery(): Builder;

    /**
     * Create a new feature vector model for the annotation of this job.
     */
    abstract protected function updateOrCreateFeatureVector(array $attributes): void;
}
