<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use Biigle\FederatedSearchInstance;
use Faker\Generator as Faker;

$factory->define(FederatedSearchInstance::class, function (Faker $faker) {
    return [
        'name' => $faker->company(),
        'url' => $faker->url(),
    ];
});
