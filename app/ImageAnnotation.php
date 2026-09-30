<?php

namespace Biigle;

use Biigle\Observers\ImageAnnotationObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

/**
 * An image annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 */
#[ObservedBy(ImageAnnotationObserver::class)]
class ImageAnnotation extends Annotation
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'image_id' => 'int',
            'shape_id' => 'int',
            'points' => 'array',
        ];
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
        $points = array_map(fn ($coordinate) => round($coordinate, 2), $points);

        $this->attributes['points'] = json_encode($points);
    }

    /**
     * The image, this annotation belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Image, $this>
     */
    public function image()
    {
        return $this->belongsTo(Image::class);
    }

    /**
     * {@inheritdoc}
     */
    public function file()
    {
        return $this->image();
    }

    /**
     * Get the file_id attribute
     *
     * @return int
     */
    public function getFileIdAttribute()
    {
        return $this->image_id;
    }

    /**
     * {@inheritdoc}
     */
    public function labels()
    {
        return $this->hasMany(ImageAnnotationLabel::class, 'annotation_id');
    }
}
