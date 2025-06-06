<?php

namespace Database\Factories;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\Volume;
use Illuminate\Database\Eloquent\Factories\Factory;

class VideoAnnotationLabelFeatureVectorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'id' => VideoAnnotationLabel::factory(),
            'annotation_id' => VideoAnnotation::factory(),
            'label_id' => Label::factory(),
            'label_tree_id' => LabelTree::factory(),
            'volume_id' => Volume::factory(),
            'vector' => range(0, 383),
        ];
    }
}
