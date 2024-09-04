<?php

namespace Biigle;

class VideoAnnotationLabel extends AnnotationLabel
{
    /**
     * The video annotation, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<VideoAnnotation, VideoAnnotationLabel>
     */
    public function annotation()
    {
        return $this->belongsTo(VideoAnnotation::class, 'annotation_id');
    }
}
