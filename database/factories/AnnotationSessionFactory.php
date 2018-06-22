<?php

use Faker\Generator as Faker;

$factory->define(Biigle\AnnotationSession::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
        'description' => $faker->sentence(),
        'volume_id' => function () {
            return factory(Biigle\Volume::class)->create()->id;
        },
        'starts_at' => '2016-09-04',
        'ends_at' => '2016-09-06',
        'hide_other_users_annotations' => $faker->boolean(),
        'hide_own_annotations' => $faker->boolean(),
    ];
});
