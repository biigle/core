<?php

namespace Biigle\Modules\Largo\Database\Factories;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Volume;
use Illuminate\Database\Eloquent\Factories\Factory;

class ImageAnnotationLabelFeatureVectorFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ImageAnnotationLabelFeatureVector::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'id' => ImageAnnotationLabel::factory(),
            'annotation_id' => ImageAnnotation::factory(),
            'label_id' => Label::factory(),
            'label_tree_id' => LabelTree::factory(),
            'volume_id' => Volume::factory(),
            'vector' => range(0, 383),
        ];
    }
}
