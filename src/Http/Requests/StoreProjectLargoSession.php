<?php

namespace Biigle\Modules\Largo\Http\Requests;

use Biigle\ImageAnnotation;
use Biigle\Project;
use Biigle\VideoAnnotation;

class StoreProjectLargoSession extends StoreLargoSession
{
    /**
     * The project to store the Largo session for.
     *
     * @var Project
     */
    public $project;

    /**
     * The volumes that are associated with the image annotations that should be changed.
     *
     * @var \Illuminate\Support\Collection
     */
    public $volumes;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        parent::authorize();
        $this->project = Project::findOrFail($this->route('id'));

        if (!$this->user()->can('edit-in', $this->project)) {
            return false;
        }

        if ($this->force) {
            return $this->user()->can('force-edit-in', $this->project);
        }

        $this->emptyRequest = count($this->dismissedImageAnnotations) === 0 &&
            count($this->changedImageAnnotations) === 0 &&
            count($this->dismissedVideoAnnotations) === 0 &&
            count($this->changedVideoAnnotations) === 0;

        return true;
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->emptyRequest) {
                return;
            }

            $affectedImageAnnotations = $this->getAffectedAnnotations($this->dismissedImageAnnotations, $this->changedImageAnnotations);

            $imageVolumes = $this->project->imageVolumes()
                ->whereIn('id', $this->getAffectedImageVolumes($affectedImageAnnotations))
                ->get();

            $affectedVideoAnnotations = $this->getAffectedAnnotations($this->dismissedVideoAnnotations, $this->changedVideoAnnotations);

            $videoVolumes = $this->project->videoVolumes()
                ->whereIn('id', $this->getAffectedVideoVolumes($affectedVideoAnnotations))
                ->get();

            $this->volumes = $imageVolumes->concat($videoVolumes);

            $inProgress = $this->volumes->contains(function ($volume) {
                return is_array($volume->attrs) && array_key_exists('largo_job_id', $volume->attrs);
            });

            if ($inProgress) {
                $validator->errors()->add('id', 'A Largo session is currently being saved, please try again in a few minutes.');
            }

            $volumeIds = $this->project->imageVolumes()->pluck('id');

            if (!$this->imageAnotationsBelongToVolumes($affectedImageAnnotations, $volumeIds)) {
                $validator->errors()->add('id', 'All annotations must belong to the volumes of the project.');
            }

            $volumeIds = $this->project->videoVolumes()->pluck('id');

            if (!$this->videoAnotationsBelongToVolumes($affectedVideoAnnotations, $volumeIds)) {
                $validator->errors()->add('id', 'All annotations must belong to the volumes of the project.');
            }

            $availableLabelTreeIds = $this->project->labelTrees()->pluck('id');
            $requiredLabelTreeIds = $this->getRequiredLabelTrees($this->changedImageAnnotations);

            if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
                $validator->errors()->add('changed_image_annotations', 'You may only attach labels that belong to one of the label trees available for the project.');
            }

            $requiredLabelTreeIds = $this->getRequiredLabelTrees($this->changedVideoAnnotations);

            if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
                $validator->errors()->add('changed_video_annotations', 'You may only attach labels that belong to one of the label trees available for the project.');
            }
        });
    }

    /**
     * Get the IDs of the image volumes that are associated with the referenced image
     * annotations.
     *
     * @param array $annotations
     *
     * @return array
     */
    protected function getAffectedImageVolumes($annotations)
    {
        $chunkedAnnotations = array_chunk($annotations,config('biigle.db_param_limit'));
        $volumeIdsArray = [];
        foreach($chunkedAnnotations as $chunkedAnnotation){
            $chunkVolumeId = ImageAnnotation::join('images', 'image_annotations.image_id', '=', 'images.id')
                ->whereIn('image_annotations.id', $chunkedAnnotation)
                ->distinct()
                ->pluck('images.volume_id')
                ->toArray();
            $volumeIdsArray = array_merge($volumeIdsArray, $chunkVolumeId);
        }
        return array_unique($volumeIdsArray);
    }

    /**
     * Get the IDs of the video volumes that are associated with the referenced video
     * annotations.
     *
     * @param array $annotations
     *
     * @return array
     */
    protected function getAffectedVideoVolumes($annotations)
    {
        $chunkedAnnotations = array_chunk($annotations,config('biigle.db_param_limit'));
        $volumeIdsArray = [];
        foreach($chunkedAnnotations as $chunkedAnnotation){
            $chunkVolumeId = VideoAnnotation::join('videos', 'video_annotations.video_id', '=', 'videos.id')
                ->whereIn('video_annotations.id', $chunkedAnnotation)
                ->distinct()
                ->pluck('videos.volume_id')
                ->toArray();
            $volumeIdsArray = array_merge($volumeIdsArray, $chunkVolumeId);
        }
        return array_unique($volumeIdsArray);
    }
}
