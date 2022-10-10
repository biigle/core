<?php

namespace Database\Factories;

use Biigle\Visibility;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabelTreeFactory extends Factory
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
            'visibility_id' => function () {
                return Visibility::publicId();
            },
            'uuid' => $this->faker->unique()->uuid(),
        ];
    }
}
