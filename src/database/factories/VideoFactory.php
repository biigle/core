<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Modules\Videos\Video::class, function (Faker $faker) {
    return [
        'uuid' => $faker->unique()->uuid(),
        'name' => $faker->firstName(),
        'url' => $faker->url(),
        'attrs' => [],
        'project_id' => function () {
            return factory(Biigle\Project::class)->create()->id;
        },
    ];
});
