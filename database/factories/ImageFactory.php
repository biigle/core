<?php

namespace Database\Factories;

use Biigle\MediaType;
use Biigle\Volume;

class ImageFactory extends VolumeFileFactory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return array_merge(parent::definition(), [
            'filename' => 'test-image.jpg',
            'tiled' => false,
        ]);
    }

    /**
     * Get the volume factory.
     *
     * @return Factory
     */
    protected function getVolumeFactory()
    {
        return Volume::factory()->for(MediaType::image());
    }
}
