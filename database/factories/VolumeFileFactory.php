<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

abstract class VolumeFileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'uuid' => $this->faker->unique()->uuid(),
            'volume_id' => $this->getVolumeFactory(),
        ];
    }

    /**
     * Get the volume factory.
     *
     * @return Factory
     */
    abstract protected function getVolumeFactory();
}
