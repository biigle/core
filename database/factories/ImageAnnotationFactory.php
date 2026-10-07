<?php

namespace Database\Factories;

use Biigle\Enums\Shape;
use Biigle\Image;
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
            'shape' => Shape::POINT,
            'points' => [0, 0],
        ];
    }
}
