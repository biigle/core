<?php

namespace Biigle\Http\Requests;

use Biigle\AnnotationGuidelineLabel;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Response;

class DestroyProjectLabelTree extends FormRequest
{
    public $project;

    public function authorize()
    {
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->project);
    }

    public function rules()
    {
        return [
            'force' => 'nullable|boolean',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->input('force')) {
                return;
            }

            $treeId = $this->route('id2');
            $hasGuidelineLabels = AnnotationGuidelineLabel::join('annotation_guidelines', 'annotation_guidelines.id', '=', 'annotation_guideline_label.annotation_guideline_id')
                ->where('annotation_guidelines.project_id', $this->project->id)
                ->whereIn('label_id', fn ($q) => $q->select('id')->from('labels')->where('label_tree_id', $treeId))
                ->exists();

            if ($hasGuidelineLabels) {
                abort(Response::HTTP_CONFLICT, 'The label tree has annotation guideline labels that would be deleted. Use the "force" argument to detach and delete them.');
            }
        });
    }
}
