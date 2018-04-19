<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Project::class, function (Faker $faker) {
    return [
        'name' => $faker->company(),
        'description' => $faker->sentence(),
        'creator_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
    ];
});
