<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Video::class, function (Faker $faker) {
    return [
        'uuid' => $faker->unique()->uuid(),
        'name' => $faker->firstName(),
        'url' => $faker->url(),
        'attrs' => [],
        'duration' => 0,
        'project_id' => function () {
            return factory(Biigle\Project::class)->create()->id;
        },
        'creator_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
    ];
});
