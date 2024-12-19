<?php

namespace Biigle;

/**
 * An image annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 */
class ImageAnnotation extends Annotation
{
    /**
    * The attributes that should be casted to native types.
    *
    * @var array<string, string>
    */
    protected $casts = [
        'image_id' => 'int',
        'shape_id' => 'int',
        'points' => 'array',
    ];

    /**
     * The attributes that should be included in the JSON response.
     *
     * @var array<int, string>
     */
    protected $appends = ['labelBOTLabels'];

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
