<?php

namespace Database\Factories;

use Biigle\ImageAnnotation;

class ImageAnnotationLabelFactory extends AnnotationLabelFactory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return array_merge(parent::definition(), [
            'annotation_id' => ImageAnnotation::factory(),
            'confidence' => $this->faker->randomFloat(null, 0, 1),
        ]);
    }
}
