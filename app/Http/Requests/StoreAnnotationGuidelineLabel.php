<?php
namespace Biigle\Http\Requests;

use Biigle\AnnotationGuideline;
use Biigle\Label;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAnnotationGuidelineLabel extends FormRequest
{
    /**
     * The annotation guideline
     *
     * @var AnnotationGuideline
     */
    public $guideline;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->guideline = AnnotationGuideline::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->guideline);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $belongsToProject = Label::where('id', $this->input('label_id'))
                ->whereIn('label_tree_id', fn ($q) => $q->select('label_tree_id')->from('label_tree_project')->where('project_id', $this->guideline->project_id))
                ->exists();

            if (!$belongsToProject) {
                $validator->errors()->add('label_id', 'The label does not belong to a label tree of this project.');
            }
        });
    }

    /**
     * The rules that the request should follow
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'label_id' => ['required', 'integer', 'exists:labels,id'],
            'description' => ['nullable', 'string'],
            'shape_id' => ['nullable', 'integer', 'exists:shapes,id'],
            'reference_image' => [
                'nullable',
                'file',
                'mimes:jpg',
                'max:5120',
                'dimensions:max_width=1000,max_height=1000',
            ],
        ];
    }
}
