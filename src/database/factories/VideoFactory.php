<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Modules\Videos\Video::class, function (Faker $faker) {
    return [
        'name' => $faker->firstName(),
        'uuid' => $faker->unique()->uuid(),
        'meta' => [],
    ];
});
