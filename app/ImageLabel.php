<?php

namespace Biigle;

class ImageLabel extends VolumeFileLabel
{
    /**
     * {@inheritdoc}
     */
    public function file()
    {
        return $this->image();
    }

    /**
     * The image, this image label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Image, $this>
     */
    public function image()
    {
        return $this->belongsTo(Image::class);
    }

    /**
     * Get the file ID attribute.
     *
     * @return int
     */
    public function getFileIdAttribute()
    {
        return $this->image_id;
    }
}
