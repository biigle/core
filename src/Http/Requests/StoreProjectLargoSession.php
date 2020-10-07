<?php

namespace Biigle\Modules\Largo\Http\Requests;

use Biigle\ImageAnnotation;
use Biigle\Project;

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
            if (count($this->dismissed) === 0 && count($this->changed) === 0) {
                return;
            }

            $affectedAnnotations = $this->getAffectedAnnotations($this->dismissed, $this->changed);

            $this->volumes = $this->project->imageVolumes()
                ->whereIn('id', $this->getAffectedVolumes($affectedAnnotations))
                ->get();

            $inProgress = $this->volumes->contains(function ($volume) {
                return is_array($volume->attrs) && array_key_exists('largo_job_id', $volume->attrs);
            });

            if ($inProgress) {
                $validator->errors()->add('id', 'A Largo session is currently being saved, please retry later.');
            }

            $volumeIds = $this->project->imageVolumes()->pluck('id');

            if (!$this->anotationsBelongToVolumes($affectedAnnotations, $volumeIds)) {
                $validator->errors()->add('id', 'All annotations must belong to the volumes of the project.');
            }

            $availableLabelTreeIds = $this->project->labelTrees()->pluck('id');
            $requiredLabelTreeIds = $this->getRequiredLabelTrees($this->changed);

            if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
                $validator->errors()->add('changed', 'You may only attach labels that belong to one of the label trees available for the project.');
            }
        });
    }

    /**
     * Get the IDs of the volumes that are associated with the referenced image
     * annotations.
     *
     * @param array $affectedAnnotations
     *
     * @return array
     */
    protected function getAffectedVolumes($affectedAnnotations)
    {
        return ImageAnnotation::join('images', 'image_annotations.image_id', '=', 'images.id')
            ->whereIn('image_annotations.id', $affectedAnnotations)
            ->distinct()
            ->pluck('images.volume_id');
    }
}
