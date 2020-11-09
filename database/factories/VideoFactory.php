<?php

use Biigle\MediaType;
use Faker\Generator as Faker;

$factory->define(Biigle\Video::class, function (Faker $faker) {
    return [
        'uuid' => $faker->unique()->uuid(),
        'filename' => $faker->unique()->word(),
        'volume_id' => function () {
            return factory(Biigle\Volume::class)->create([
                'media_type_id' => MediaType::videoId(),
            ])->id;
        },
        'attrs' => [],
        'duration' => 0,
    ];
});
