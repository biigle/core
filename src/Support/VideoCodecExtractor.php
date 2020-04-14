<?php

namespace Biigle\Modules\Videos\Support;

use FFMpeg\FFProbe;

class VideoCodecExtractor
{
    /**
     * FFProbe instance.
     *
     * @var FFProbe
     */
    protected $ffprobe;

    /**
     * Extract the video codec from the specified video file.
     *
     * @param string $url
     *
     * @return string
     */
    public function extract($url)
    {
        if (!isset($this->ffprobe)) {
            $this->ffprobe = FFProbe::create();
        }

        return $this->ffprobe->streams($url)->videos()->first()->get('codec_name');
    }
}
