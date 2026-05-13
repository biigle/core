<?php
namespace Biigle\Http\Requests;

use Biigle\AnnotationGuideline;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;

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
                'mimes:jpg,png,webp',
                'max:5120',
                'dimensions:max_width=300,max_height=300',
            ],
        ];
    }
}
