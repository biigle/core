<?php

namespace Biigle\Modules\Largo\Http\Requests;

use Biigle\Project;
use Biigle\Role;
use Biigle\Volume;
use DB;

class StoreVolumeLargoSession extends StoreLargoSession
{
    /**
     * The volume to store the Largo session for.
     *
     * @var Volume
     */
    public $volume;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        parent::authorize();
        $this->volume = Volume::findOrFail($this->route('id'));

        if (!$this->user()->can('edit-in', $this->volume)) {
            return false;
        }

        if ($this->force) {
            return $this->user()->can('force-edit-in', $this->volume);
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
            if (is_array($this->volume->attrs) && array_key_exists('largo_job_id', $this->volume->attrs)) {
                $validator->errors()->add('id', 'A Largo session is currently being saved, please retry later.');
            }

            if (!$this->volume->isImageVolume()) {
                $validator->errors()->add('id', 'Only available for image volumes.');
            }

            if (count($this->dismissed) === 0 && count($this->changed) === 0) {
                return;
            }

            $affectedAnnotations = $this->getAffectedAnnotations($this->dismissed, $this->changed);

            if (!$this->anotationsBelongToVolumes($affectedAnnotations, [$this->volume->id])) {
                $validator->errors()->add('id', 'All annotations must belong to the specified volume.');
            }

            $availableLabelTreeIds = $this->getAvailableLabelTrees($this->volume);
            $requiredLabelTreeIds = $this->getRequiredLabelTrees($this->changed);

            if ($requiredLabelTreeIds->diff($availableLabelTreeIds)->count() > 0) {
                $validator->errors()->add('changed', 'You may only attach labels that belong to one of the label trees available for the specified volume.');
            }
        });
    }

    /**
     * Get label trees of projects that the requesting user and the volume have in
     * common.
     *
     * @param Volume $volume
     *
     * @return Collection
     */
    protected function getAvailableLabelTrees($volume)
    {
        if ($this->user()->can('sudo')) {
            // Global admins have no restrictions.
            $projects = $volume->projects()->pluck('id');
        } else {
            // All projects that the user and the volume have in common
            // and where the user is editor, expert or admin.
            $projects = Project::inCommon($this->user(), $volume->id, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');
        }

        return DB::table('label_tree_project')
            ->whereIn('project_id', $projects)
            ->distinct()
            ->pluck('label_tree_id');
    }
}
