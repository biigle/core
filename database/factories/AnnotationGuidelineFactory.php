<?php

namespace Database\Factories;

use Biigle\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnotationGuidelineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'project_id' => Project::factory(),
            'description' => null,
        ];
    }
}
