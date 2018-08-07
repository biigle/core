<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Role::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
    ];
});
