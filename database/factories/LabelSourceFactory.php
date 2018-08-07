<?php

use Faker\Generator as Faker;

$factory->define(Biigle\LabelSource::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
        'description' => $faker->sentence(),
    ];
});
