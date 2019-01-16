<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Modules\Videos\VideoAnnotation::class, function (Faker $faker) {
    return [
        'frames' => [],
        'points' => [],
        'video_id' => function () {
            return factory(Biigle\Modules\Videos\Video::class)->create()->id;
        },
        'shape_id' => function () {
            return factory(Biigle\Shape::class)->create()->id;
        },
    ];
});
