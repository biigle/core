<?php

namespace Database\Factories;

use Biigle\Image;
use Biigle\Shape;
use Illuminate\Database\Eloquent\Factories\Factory;

class ImageAnnotationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'image_id' => Image::factory(),
            'shape' => Shape::POINT->value,
            'points' => [0, 0],
        ];
    }
}
