<?php

namespace Biigle\Http\Requests;

use Biigle\Shape;
use Biigle\Video;
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

        return $this->user()->can('add-annotation', $this->video);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'label_id' => 'required|integer|exists:labels,id',
            'shape_id' => 'required|integer|exists:shapes,id',
            'points' => [
                'required_unless:shape_id,'.Shape::wholeFrameId(),
                'array',
            ],
            'frames' => 'required|array',
            'frames.*' => 'required|numeric|min:0|max:'.$this->video->duration,
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
        $validator->after(function ($validator) {
            $frameCount = count($this->input('frames', []));

            if ($this->input('shape_id') === Shape::wholeFrameId() && $frameCount > 2) {
                $validator->errors()->add('frames', 'A new whole frame annotation must not have more than two frames.');
            }

            if ($this->shouldTrack()) {
                if ($frameCount !== 1) {
                    $validator->errors()->add('id', 'Only single frame annotations can be tracked.');
                }

                if (count($this->input('points', [])) !== 1) {
                    $validator->errors()->add('id', 'Only single frame annotations can be tracked.');
                }

                $allowedShapes = [
                    Shape::pointId(),
                    Shape::circleId(),
                ];

                if (!in_array(intval($this->input('shape_id')), $allowedShapes)) {
                    $validator->errors()->add('id', 'Only point and circle annotations can be tracked.');
                }

                // Only do this for videos with stored dimensions for backwards
                // compatibility. Older videos may not have stored dimensions, yet.
                // In this case, the Python script will fail without a graceful error.
                if (!is_null($this->video->width) && !is_null($this->video->height) && !$this->annotationContained()) {
                    $validator->errors()->add('points', 'An annotation to track must be fully contained by the video boundaries.');
                }
            }
        });
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

    /**
     * Check if the point or circle annotation is fully contained by the video.
     *
     * @return bool
     */
    protected function annotationContained()
    {
        $radius = 0;
        $points = $this->input('points')[0];

        if (intval($this->input('shape_id')) === Shape::pointId()) {
            $radius = config('videos.tracking_point_padding');
        } elseif (intval($this->input('shape_id')) === Shape::circleId()) {
            $radius = $points[2];
        } else {
            return false;
        }

        return ($points[0] - $radius) >= 0 &&
            ($points[1] - $radius) >= 0 &&
            ($points[0] + $radius) <= $this->video->width &&
            ($points[1] + $radius) <= $this->video->height;
    }
}
