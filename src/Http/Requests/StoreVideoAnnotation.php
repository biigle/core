<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Modules\Videos\Video;
use Illuminate\Foundation\Http\FormRequest;

class StoreVideoAnnotation extends FormRequest
{
    /**
     * The video on which the annotation should be created.
     *
     * @var Video
     */
    public $video;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->video = Video::findOrFail($this->route('id'));

        return $this->user()->can('edit-in', $this->video);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'label_id' => 'required|exists:labels,id',
            'shape_id' => 'required|exists:shapes,id',
            'points' => 'required|array',
            'frames' => 'required|array',
        ];
    }
}
