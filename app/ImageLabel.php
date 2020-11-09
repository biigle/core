<?php

namespace Biigle;

class ImageLabel extends VolumeFileLabel
{
    /**
     * The file, this volume file label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function file()
    {
        return $this->image();
    }

    /**
     * The image, this image label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
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
