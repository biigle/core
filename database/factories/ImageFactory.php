<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Image::class, function (Faker $faker) {
    return [
        'filename' => 'test-image.jpg',
        'uuid' => $faker->unique()->uuid(),
        'volume_id' => function () {
            return factory(Biigle\Volume::class)->create()->id;
        },
        'tiled' => false,
    ];
});
