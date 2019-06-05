<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Project;
use Biigle\Modules\Videos\Rules\VideoUrl;
use Illuminate\Foundation\Http\FormRequest;

class StoreVideo extends FormRequest
{
    /**
     * The project to attach the video to.
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

        return $this->user()->can('update', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|max:255',
            'url' => ['required', 'max:255', new VideoUrl],
        ];
    }
}
