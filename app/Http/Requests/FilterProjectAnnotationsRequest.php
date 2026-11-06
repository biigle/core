<?php

namespace Biigle\Http\Requests;

use Biigle\Project;

class FilterProjectAnnotationsRequest extends FilterAnnotationsRequest
{
    /**
     * To which project the annotations are being filtered.
     *
     * @var Project
     */
    public $project;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->project = Project::findOrFail($this->route('id'));
        $this->labelId = intval($this->route('id2'));

        return $this->user()->can('access', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'volume_id' => 'nullable|array',
            'volume_id.*' => 'integer',
        ]);
    }
}
