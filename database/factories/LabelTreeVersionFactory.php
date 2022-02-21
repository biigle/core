<?php

namespace Database\Factories;

use Biigle\LabelTree;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabelTreeVersionFactory extends Factory
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
            'doi' => $this->faker->username(),
            'label_tree_id' => LabelTree::factory(),
        ];
    }
}
