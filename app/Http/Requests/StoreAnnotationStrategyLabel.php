<?php
namespace Biigle\Http\Requests;

use Biigle\Project;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnnotationStrategyLabel extends FormRequest
{
    /**
     * The project of the annotation strategy
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
            'labels' => ['required', 'array'],
            'labels.*' => ['required', 'integer'],
            'descriptions' => ['required', 'array'],
            'descriptions.*' => ['required', 'string'],
            'shapes' => ['required', 'array'],
            'shapes.*' => ['nullable', 'integer'],
            'reference_images' => ['required', 'array'],
            'reference_images.*' => ['nullable', 'file', 'mimes:jpg', 'dimensions:max_width=300,max_height=300'],
        ];
    }
}
