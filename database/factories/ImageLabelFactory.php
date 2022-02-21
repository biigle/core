<?php

namespace Database\Factories;

use Biigle\Image;

class ImageLabelFactory extends VolumeFileLabelFactory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return array_merge(parent::definition(), [
            'image_id' => Image::factory(),
        ]);
    }
}
