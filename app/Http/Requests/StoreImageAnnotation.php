<?php

namespace Biigle\Http\Requests;

use Biigle\Image;
use Biigle\Shape;

class StoreImageAnnotation extends StoreImageAnnotationLabel
{
    /**
     * The image on which the annotation should be created.
     *
     * @var Image
     */
    public $image;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->image = Image::findOrFail($this->route('id'));

        return $this->user()->can('add-annotation', $this->image);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return array_merge(parent::rules(), [
            'shape_id' => 'required|integer|exists:shapes,id',
            'points'   => 'required|array',
        ]);
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
            if ($this->input('shape_id') === Shape::wholeFrameId()) {
                $validator->errors()->add('shape_id', 'Image annotations cannot have shape WholeFrame.');
                return;
            }

            if (!$this->input('points')) {
                $validator->errors()->add('points', 'Invalid shape. No points given.');
                return;
            }

            $fails = false;
            $points = $this->input('points');

            switch ($this->input('shape_id')) {
                case (Shape::circleId()):
                    // Circle needs x,y coordinate and non zero radius
                    $fails = count($points) !== 3 || intval(($points)[2]) === 0;
                    break;
                case (Shape::ellipseId()):
                case (Shape::rectangleId()):
                    // Ellipse and rectangle need exactly 4 distinct points
                    $fails = count($points) !== 8 || $this->countDistinctPoints($points) !== 4;
                    break;
                case (Shape::lineId()):
                    // Line need at least 2 distinct points
                    $fails = count($points) < 4 || $this->countDistinctPoints($points) < 2;
                    break;
                case (Shape::polygonId()):
                    // Polygon needs at least 3 distinct points
                    $fails = count($points) < 6 || $this->countDistinctPoints($points) < 3;
                    break;
                case (Shape::pointId()):
                    // Points needs exactly one x and y coordinate
                    $fails = count($points) !== 2;
            }

            if ($fails) {
                $validator->errors()->add('points', 'Invalid shape.');
            }

        });
    }

    /**
     * Counts number of distinct points
     * @param array $points containing the coordinates
     * @return int number of distinct points
     * **/
    private function countDistinctPoints($points)
    {
        $points = collect($points);
        // Use values to reset index
        $x = $points->filter(fn ($x, $idx) => $idx % 2 === 0)->values();
        $y = $points->filter(fn ($x, $idx) => $idx % 2 === 1)->values();
        $coords = collect($x->map(fn ($x, $idx) => [$x, $y[$idx]]))->unique();
        return count($coords);
    }
}
