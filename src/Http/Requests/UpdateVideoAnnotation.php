<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Modules\Videos\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVideoAnnotation extends FormRequest
{
    /**
     * The annotation that should be updated
     *
     * @var VideoAnnotation
     */
    public $annotation;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->annotation = VideoAnnotation::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->annotation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'points' => 'required|array',
            'frames' => 'required|array',
        ];
    }
}
