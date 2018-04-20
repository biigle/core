<?php

use Faker\Generator as Faker;

$factory->define(Biigle\MediaType::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
    ];
});
