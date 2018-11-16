<?php

use Faker\Generator as Faker;

$factory->define(Biigle\LabelTree::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
        'description' => $faker->sentence(),
        'visibility_id' => Biigle\Visibility::publicId(),
        'uuid' => $faker->unique()->uuid(),
    ];
});
