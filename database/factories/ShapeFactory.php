<?php

use Faker\Generator as Faker;

$factory->define(App\Shape::class, function (Faker $faker) {
    return [
        'name' => $faker->firstName(),
    ];
});
