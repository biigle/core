<?php

use Faker\Generator as Faker;

$factory->define(Biigle\VideoAnnotationLabel::class, function (Faker $faker) {
    return [
        'video_annotation_id' => function () {
            return factory(Biigle\VideoAnnotation::class)->create()->id;
        },
        'label_id' => function () {
            return factory(Biigle\Label::class)->create()->id;
        },
        'user_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
    ];
});
