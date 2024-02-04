<?php

namespace Database\Factories;

use Biigle\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition(): array
    {
        return [
            'firstname' => $this->faker->firstName(),
            'lastname' => $this->faker->lastName(),
            // 'password', hashed with 4 rounds as defined in phpunit.xml
            'password' => '$2y$04$aqV2XBF34eexL9ezbQZs1eM872NWgH5MhvrmD0SC9qUbhmg9EoxJq',
            'email' => $this->faker->unique()->email(),
            'remember_token' => Str::random(10),
            'uuid' => $this->faker->unique()->uuid(),
            'affiliation' => $this->faker->company(),
            'role_id' => fn () => Role::editorId(),
        ];
    }
}
