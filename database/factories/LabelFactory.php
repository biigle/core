<?php

namespace Database\Factories;

use Biigle\LabelTree;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabelFactory extends Factory
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
            'color' => '0099ff',
            'parent_id' => null,
            'label_tree_id' => LabelTree::factory(),
            'uuid' => $this->faker->unique()->uuid(),
        ];
    }
}
