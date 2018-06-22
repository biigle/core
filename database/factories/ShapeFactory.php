<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Shape::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
    ];
});
