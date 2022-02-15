<?php

namespace Database\Factories;

use Biigle\Video;

class VideoLabelFactory extends VolumeFileLabelFactory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return array_merge(parent::definition(), [
            'video_id' => Video::factory(),
        ]);
    }
}
