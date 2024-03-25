<?php

namespace Biigle;

use Exception;

class VideoAnnotation extends Annotation
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'video_id',
        'shape_id',
        'points',
        'frames',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'video_id' => 'int',
        'shape_id' => 'int',
        'frames' => 'array',
        'points' => 'array',
    ];

    /**
     * The video, this annotation belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function video()
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * The file, this annotation belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function file()
    {
        return $this->video();
    }

    /**
     * Get the file_id attribute
     *
     * @return int
     */
    public function getFileIdAttribute()
    {
        return $this->video_id;
    }

    /**
     * The labels that are attached to this annotation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function labels()
    {
        return $this->hasMany(VideoAnnotationLabel::class, 'annotation_id');
    }

    /**
     * Round the floats of the points array to 2 decimals before saving.
     *
     * This is a more than sufficient precision for annotation point coordinates and
     * saves memory in the DB as well as when processing the annotations in PHP.
     *
     * @param array $points
     */
    public function setPointsAttribute(array $points)
    {
        $points = array_map(fn ($points) => array_map(fn ($value) => round($value, 2), $points), $points);

        $this->attributes['points'] = json_encode($points);
    }

    /**
     * Validate the points and frames of this annotation.
     *
     * @param array $points Not used
     * @throws Exception If the points or frames are invalid.
     */
    public function validatePoints(array $points = [])
    {
        if ($this->shape_id === Shape::wholeFrameId()) {
            if (count($this->points) !== 0) {
                throw new Exception('Whole frame annotations cannot have point coordinates.');
            }

            return;
        }

        if (count($this->points) !== count($this->frames)) {
            throw new Exception('The number of key frames does not match the number of annotation coordinates.');
        }

        // Gaps are represented as empty arrays
        array_map(function ($point) {
            if (count($point)) {
                parent::validatePoints($point);
            }
        }, $this->points);
    }

    /**
     * Get the interpolated points at a specific point of time.
     *
     * This method must be equivalent to the interpolatePoints function of the JavaScript
     * annotation model!
     *
     * @param float $time
     *
     * @return array
     */
    public function interpolatePoints(float $time)
    {
        $frames = array_map('floatval', $this->frames);
        $startFrame = $frames[0];
        $endFrame = end($frames);

        if ($time < $startFrame || $time > $endFrame) {
            return [];
        }

        $i = count($frames) - 1;
        for (; $i >= 0 ; $i--) {
            if ($frames[$i] <= $time) {
                break;
            }
        }

        if ($frames[$i] === $time) {
            return $this->points[$i];
        }

        $progress = ($time - $frames[$i]) / ($frames[$i + 1] - $frames[$i]);

        return $this->interpolateBetweenFrames($i, $i + 1, $progress);
    }

    /**
     * Get the interpolated points of this annotation between the specified frames.
     *
     * @param int $index1 Index of the first frame.
     * @param int $index2 Index of the second frame.
     * @param float $progress Progress between the two frames.
     *
     * @return array
     */
    protected function interpolateBetweenFrames($index1, $index2, $progress)
    {
        $points = $this->getInterpolationPoints();
        $points1 = $points[$index1];
        $points2 = $points[$index2];

        switch ($this->shape_id) {
            case Shape::rectangleId():
            case Shape::ellipseId():
                return $this->interpolationPointsToRectangle(
                    $this->interpolateNaive($points1, $points2, $progress)
                );
            case Shape::lineId():
            case Shape::polygonId():
                throw new Exception('Interpolation of line strings or polygons is not implemented.');
            case Shape::wholeFrameId():
                throw new Exception('Whole frame annotations cannot be interpolated.');
            default:
                return $this->interpolateNaive($points1, $points2, $progress);
        }
    }

    /**
     * Get the points of this annotation prepared for interpolation.
     *
     * @return array
     */
    protected function getInterpolationPoints()
    {
        switch ($this->shape_id) {
            case Shape::rectangleId():
            case Shape::ellipseId():
                return array_map([$this, 'rectangleToInterpolationPoints'], $this->points);
            case Shape::lineId():
            case Shape::polygonId():
                return [];
            default:
                return $this->points;
        }
    }

    /**
     * Interpolate between two points arrays.
     *
     * @param array $from
     * @param array $to
     * @param float $progress
     *
     * @return array
     */
    protected function interpolateNaive($from, $to, $progress)
    {
        return array_map(fn ($index, $value) => $value + ($to[$index] - $value) * $progress, array_keys($from), $from);
    }

    /**
     * Convert the points array of a rectangle (frame) to points that can be
     * interpolated.
     *
     * @param array $points
     *
     * @return array
     */
    protected function rectangleToInterpolationPoints($points)
    {
        // Return the center point, the normalized vector from the first point
        // (A) to the second point (B), the width (A->B) and the height (A->D).
        $ab = [$points[2] - $points[0], $points[3] - $points[1]];
        $ad = [$points[6] - $points[0], $points[7] - $points[1]];
        $w = sqrt($ad[0] * $ad[0] + $ad[1] * $ad[1]);
        $h = sqrt($ab[0] * $ab[0] + $ab[1] * $ab[1]);
        $normalizedAb = [$ab[0] / $h, $ab[1] / $h];

        $center = [
            ($points[0] + $points[2] + $points[4] + $points[6]) / 4,
            ($points[1] + $points[3] + $points[5] + $points[7]) / 4,
        ];

        return [$center[0], $center[1], $normalizedAb[0], $normalizedAb[1], $w, $h];
    }

    /**
     * Convert points that can be interpolated back to the points of a rectangle (frame).
     *
     * @param array $points
     *
     * @return array
     */
    protected function interpolationPointsToRectangle($points)
    {
        // Reconstruct a rectangle from the center point, the normalized vector
        // from the first point (A) to the second point (B), the width and the
        // height.
        $normalizedAb = [$points[2], $points[3]];
        $perpendicularAb = [-$normalizedAb[1], $normalizedAb[0]];
        $halfWpAb0 = $points[4] / 2 * $perpendicularAb[0];
        $halfWpAb1 = $points[4] / 2 * $perpendicularAb[1];
        $halfHnAb0 = $points[5] / 2 * $normalizedAb[0];
        $halfHnAb1 = $points[5] / 2 * $normalizedAb[1];

        return [
            // A: Move from center backwards half the height in normalizedAb
            // direction and half the width in perpendicularAb direction.
            $points[0] - $halfHnAb0 - $halfWpAb0,
            $points[1] - $halfHnAb1 - $halfWpAb1,
            // B
            $points[0] + $halfHnAb0 - $halfWpAb0,
            $points[1] + $halfHnAb1 - $halfWpAb1,
            // C
            $points[0] + $halfHnAb0 + $halfWpAb0,
            $points[1] + $halfHnAb1 + $halfWpAb1,
            // D
            $points[0] - $halfHnAb0 + $halfWpAb0,
            $points[1] - $halfHnAb1 + $halfWpAb1,
        ];
    }
}
