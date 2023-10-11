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
            // 'password'
            'password' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
            'email' => $this->faker->unique()->email(),
            'remember_token' => Str::random(10),
            'uuid' => $this->faker->unique()->uuid(),
            'affiliation' => $this->faker->company(),
            'role_id' => fn () => Role::editorId(),
        ];
    }
}
