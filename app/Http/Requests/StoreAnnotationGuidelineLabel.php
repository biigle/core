<?php
namespace Biigle\Http\Requests;

use Biigle\Project;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnnotationGuidelineLabel extends FormRequest
{
    /**
     * The project of the annotation guideline
     *
     * @var Project
     */
    public $project;

    /**
     * The user making the request.
     *
     * @var User
     */
    public $user;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->project);
    }

    /**
     * The rules that the request should follow
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'label' => ['required', 'integer'],
            'description' => ['nullable', 'string'],
            'shape' => ['nullable', 'integer'],
            'reference_image' => ['nullable', 'file', 'mimes:jpg,png,webp', 'max:5120', 'dimensions:max_width=300,max_height=300'],
        ];
    }
}
