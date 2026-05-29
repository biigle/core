<?php

namespace Database\Factories;

use Biigle\AnnotationGuideline;
use Biigle\Label;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnotationGuidelineLabelFactory extends Factory
{
    public function definition()
    {
        return [
            'annotation_guideline_id' => AnnotationGuideline::factory(),
            'label_id' => Label::factory(),
            'shape_id' => null,
            'description' => null,
            'uuid' => $this->faker->unique()->uuid(),
        ];
    }
}
