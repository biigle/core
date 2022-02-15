<?php

namespace Database\Factories;

use Biigle\MediaType;
use Biigle\Volume;

class VideoFactory extends VolumeFileFactory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return array_merge(parent::definition(), [
            'filename' => $this->faker->unique()->word(),
            'attrs' => [],
            'duration' => 0,
        ]);
    }

    /**
     * Get the volume factory.
     *
     * @return Factory
     */
    protected function getVolumeFactory()
    {
        return Volume::factory()->for(MediaType::video());
    }
}
