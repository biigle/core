<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Dias\Contracts\BelongsToProjectContract;
use Exception;
use Dias\Shape;

/**
 * An annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 */
class Annotation extends Model implements BelongsToProjectContract
{
    /**
     * Validation rules for attaching a label to a annotation.
     *
     * @var array
     */
    public static $attachLabelRules = [
        'label_id'    => 'required|exists:labels,id',
        'confidence'  => 'required|numeric|between:0,1',
    ];

    /**
     * Validation rules for creating a point for an annotation.
     *
     * @var array
     */
    public static $createPointRules = [
        'x' => 'required|numeric',
        'y' => 'required|numeric',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        // don't display info from the pivot table
        'pivot',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'points' => 'array',
    ];

    /**
     * Validates a points array for the shape of this annotation
     *
     * @param array $points Points array (a point may be an array or an object with 'x' and 'y')
     * @throws Exception If the points array is invalid
     */
    public function validatePoints(array $points)
    {
        // check if all elements are integer
        $valid = array_reduce($points, function ($carry, $point) {
            return $carry && is_int($point);
        }, true);

        if (!$valid) {
            throw new Exception("Point coordinates must be of type integer.");
        }

        $size = sizeof($points);

        switch ($this->shape_id) {
            case Shape::$pointId:
                $valid = $size === 2;
                break;
            case Shape::$circleId:
                $valid = $size === 3;
                break;
            case Shape::$rectangleId:
                $valid = $size === 8;
                break;
            default:
                $valid = $size > 0 && $size % 2 === 0;
        }

        if (!$valid) {
            throw new Exception('Invalid number of points for shape '.$this->shape->name.'!');
        }
    }

    /**
     * The image, this annotation belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function image()
    {
        return $this->belongsTo('Dias\Image');
    }

    /**
     * The shape of this annotation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function shape()
    {
        return $this->belongsTo('Dias\Shape');
    }

    /**
     * The labels, this annotation got assigned by the users.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function labels()
    {
        return $this->hasMany('Dias\AnnotationLabel')->with('label', 'user');
    }

    /**
     * {@inheritdoc}
     * @return array
     */
    public function projectIds()
    {
        return $this->image->projectIds();
    }
}
