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
            if ($validator->messages()->isNotEmpty()) {
                // Skip additional validation rules if the regular rules above failed.
                return;
            }

            $frameCount = count($this->input('frames', []));

            if ($this->input('shape_id') === Shape::wholeFrameId() && $frameCount > 2) {
                $validator->errors()->add('frames', 'A new whole frame annotation must not have more than two frames.');
            }

            $points = $this->input('points', []);
            $allArrays = array_reduce($points, fn ($c, $i) => $c && is_array($i), true);

            if (!$allArrays) {
                $validator->errors()->add('points', 'The points must be an array of arrays.');
            }

            if ($this->shouldTrack()) {
                if ($frameCount !== 1) {
                    $validator->errors()->add('id', 'Only single frame annotations can be tracked.');
                }

                if (count($points) !== 1) {
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

            if ($this->input('shape_id') !== Shape::wholeFrameId()) {

                $containsNonArray = collect($this->input('points'))->filter(fn($p) => gettype($p) !== 'array')->isNotEmpty();
                if ($containsNonArray) {
                    $validator->errors()->add('points', 'Invalid shape. Either has no points or points in wrong format.');
                    return;
                }

                $shapes = $this->input('points');
                $expectedElementCount = 0;
                $exactValue = true;

                switch ($this->input('shape_id')) {
                    case(Shape::circleId()):
                        $shapes = collect($this->input('points'));
                        if ($shapes->filter(fn($xyr) => count($xyr) !== 3)->isNotEmpty() || $shapes->filter(fn($xyr) => $xyr[2] === 0)->isNotEmpty()) {
                            $validator->errors()->add('points', 'Invalid shape.');
                        }
                        return;
                    case(Shape::ellipseId()):
                    case(Shape::rectangleId()):
                        $expectedElementCount = 8;
                        $exactValue = true;
                        break;
                    case(Shape::lineId()):
                        $expectedElementCount = 4;
                        $exactValue = false;
                        break;
                    case(Shape::polygonId()):
                        $expectedElementCount = 6;
                        $exactValue = false;
                        break;
                    case (Shape::pointId()):
                        $expectedElementCount = 2;
                        $exactValue = true;
                        
                }
                if ($this->hasInvalidShapes($shapes, $expectedElementCount, $exactValue)) {
                    $validator->errors()->add('points', 'Invalid shape.');
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

    /**
     * Checks if shapes have invalid number of (distinct) points
     * 
     * @param array $pointArrays containing coordinates of (multiple) shapes
     * @param int $expectedCount number of expected x and y coordinates
     * @param bool $exact is used in check for exact or minimum count
     * 
     * @return bool false is shape is valid, otherwise true
     * **/
    private function hasInvalidShapes($pointArrays, $expectedCount, $exact)
    {
        foreach ($pointArrays as $points) {
            $pointCollection = collect($points);
            if (!$points || $exact && (count($points) !== $expectedCount) || !$exact && (count($points) < $expectedCount)) {
                return true;
            }

            $x = $pointCollection->filter(fn($x, $idx) => $idx % 2 === 0)->values();
            $y = $pointCollection->filter(fn($x, $idx) => $idx % 2 === 1)->values();
            $coords = collect($x->map(fn($x, $idx) => [$x, $y[$idx]]))->unique();

            if ($exact && (count($coords) !== $expectedCount / 2) || !$exact && ((count($coords) < $expectedCount / 2))) {
                return true;
            }
        };
        return false;
    }
}
