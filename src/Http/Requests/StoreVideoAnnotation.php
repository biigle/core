<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Shape;
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
            'track' => 'filled|boolean',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        if ($this->shouldTrack()) {
            $validator->after(function ($validator) {
                if (count($this->input('frames')) !== 1) {
                    $validator->errors()->add('id', 'Only single frame annotations can be tracked.');
                }

                if (count($this->input('points')) !== 1) {
                    $validator->errors()->add('id', 'Only single frame annotations can be tracked.');
                }

                if (intval($this->input('shape_id')) !== Shape::pointId()) {
                    $validator->errors()->add('id', 'Only point annotations can be tracked.');
                }
            });
        }
    }

    /**
     * Determine if the new annotation should be tracked.
     *
     * @return bool
     */
    public function shouldTrack()
    {
        return boolval($this->input('track', false));
    }
}
