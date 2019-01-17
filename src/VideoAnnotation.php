<?php

namespace Biigle\Modules\Videos;

use Exception;
use Biigle\Shape;
use Biigle\Traits\HasPointsAttribute;
use Illuminate\Database\Eloquent\Model;

class VideoAnnotation extends Model
{
    use HasPointsAttribute {
        validatePoints as baseValidatePoints;
    }

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
     * The shape of this annotation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function shape()
    {
        return $this->belongsTo(Shape::class);
    }

    /**
     * The labels that are attached to this annotation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function labels()
    {
        return $this->hasMany(VideoAnnotationLabel::class);
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
        $points = array_map(function ($points) {
            return array_map(function ($value) {
                return round($value, 2);
            }, $points);
        }, $points);

        $this->attributes['points'] = json_encode($points);
    }

    /**
     * Validate the points and frames of this annotation.
     *
     * @throws Exception If the points or frames are invalid.
     */
    public function validatePoints()
    {
        if (count($this->points) !== count($this->frames)) {
            throw new Exception('The number of key frames does not match the number of annotation coordinates.');
        }

        array_map([$this, 'baseValidatePoints'], $this->points);
    }
}
