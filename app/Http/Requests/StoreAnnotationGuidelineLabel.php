<?php
namespace Biigle\Http\Requests;

use Biigle\AnnotationGuideline;
use Biigle\Enums\Shape;
use Biigle\Label;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
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

            $this->validateShape($validator);
        });
    }

    /**
     * Check if the shape (and annotation tool) is allowed by the guideline.
     */
    protected function validateShape(Validator $validator): void
    {
        if (!$this->guideline->enforced || !$this->filled('shape')) {
            return;
        }

        $shape = $this->integer('shape');

        // The aligned rectangle tool doesn't depend on only_shapes.
        if ($shape === Shape::RECTANGLE->value && $this->boolean('allow_aligned_rectangle', true)) {
            if (!$this->guideline->allow_aligned_rectangle) {
                $validator->errors()->add('shape', 'The aligned rectangle tool is not allowed by the annotation guideline.');
            }

            return;
        }

        $onlyShapes = $this->guideline->only_shapes;
        if (!is_null($onlyShapes) && !in_array($shape, $onlyShapes, true)) {
            $validator->errors()->add('shape', 'The shape is not allowed by the annotation guideline.');
        }
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
            'description' => ['nullable', 'string', 'max:256'],
            'shape' => ['nullable', 'integer', Rule::enum(Shape::class)],
            'allow_aligned_rectangle' => ['boolean'],
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
