<?php

namespace Database\Factories;

use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnotationLabelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'label_id' => Label::factory(),
            'user_id' => User::factory(),
        ];
    }
}
