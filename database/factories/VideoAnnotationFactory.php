<?php

namespace Database\Factories;

use Biigle\Shape;
use Biigle\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

class VideoAnnotationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'frames' => [],
            'points' => [],
            'video_id' => Video::factory(),
            'shape_id' => Shape::factory(),
        ];
    }
}
