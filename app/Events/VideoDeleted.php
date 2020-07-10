<?php

namespace Biigle\Events;

use Biigle\Video;

class VideoDeleted
{
    /**
     * The video that caused this event.
     *
     * @var Video
     */
    public $video;

    /**
     * Create a new instance
     *
     * @param Video $video
     */
    public function __construct(Video $video)
    {
        $this->video = $video;
    }
}
