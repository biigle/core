<?php

namespace Database\Factories;

use Biigle\MediaType;
use Biigle\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class VolumeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->company(),
            'media_type_id' => fn () => MediaType::imageId(),
            'creator_id' => User::factory(),
            'url' => 'test://files',
        ];
    }
}
