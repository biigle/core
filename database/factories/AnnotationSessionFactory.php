<?php

namespace Database\Factories;

use Biigle\Volume;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnotationSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->username(),
            'description' => $this->faker->sentence(),
            'volume_id' => Volume::factory(),
            'starts_at' => '2016-09-04',
            'ends_at' => '2016-09-06',
            'hide_other_users_annotations' => $this->faker->boolean(),
            'hide_own_annotations' => $this->faker->boolean(),
        ];
    }
}
