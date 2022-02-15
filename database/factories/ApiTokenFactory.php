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
            // 'password'
            'hash' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
        ];
    }
}
