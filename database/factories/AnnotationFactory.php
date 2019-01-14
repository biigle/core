<?php

use Faker\Generator as Faker;

$factory->define(App\Annotation::class, function (Faker $faker) {
    return [
        'points' => [0, 0],
        'video_id' => function () {
            return factory(\App\Video::class)->create()->id;
        },
        'shape_id' => function () {
            return factory(\App\Shape::class)->create()->id;
        },
    ];
});
