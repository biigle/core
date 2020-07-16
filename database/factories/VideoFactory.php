<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Video::class, function (Faker $faker) {
    return [
        'uuid' => $faker->unique()->uuid(),
        'filename' => $faker->unique()->word(),
        'volume_id' => function () {
            return factory(Biigle\Volume::class)->create()->id;
        },
        'attrs' => [],
        'duration' => 0,
    ];
});
