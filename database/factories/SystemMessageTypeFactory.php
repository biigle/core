<?php

use Faker\Generator as Faker;

$factory->define(Biigle\SystemMessageType::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
    ];
});
