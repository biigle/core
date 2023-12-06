<?php

namespace Database\Factories;

use Biigle\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApiTokenFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'owner_id' => User::factory(),
            'purpose' => $this->faker->sentence(),
            // 'password', hashed with 4 rounds as defined in phpunit.xml
            'password' => '$2y$04$aqV2XBF34eexL9ezbQZs1eM872NWgH5MhvrmD0SC9qUbhmg9EoxJq',
        ];
    }
}
