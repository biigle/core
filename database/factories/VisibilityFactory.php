<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Visibility::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
    ];
});
