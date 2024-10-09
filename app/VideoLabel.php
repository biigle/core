<?php

namespace Biigle;

class VideoLabel extends VolumeFileLabel
{
    /**
     * {@inheritdoc}
     */
    public function file()
    {
        return $this->video();
    }

    /**
     * The video, this video label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Video, VideoLabel>
     */
    public function video()
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Get the file ID attribute.
     *
     * @return int
     */
    public function getFileIdAttribute()
    {
        return $this->video_id;
    }
}
