<?php

namespace Database\Factories;

use Biigle\VideoAnnotation;

class VideoAnnotationLabelFactory extends AnnotationLabelFactory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return array_merge(parent::definition(), [
            'annotation_id' => VideoAnnotation::factory(),
        ]);
    }
}
