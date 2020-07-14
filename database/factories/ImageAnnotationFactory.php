<?php

use Faker\Generator as Faker;

$factory->define(Biigle\ImageAnnotation::class, function (Faker $faker) {
    return [
        'image_id' => function () {
            return factory(Biigle\Image::class)->create()->id;
        },
        'shape_id' => function () {
            return factory(Biigle\Shape::class)->create()->id;
        },
        'points' => [0, 0],
    ];
});
