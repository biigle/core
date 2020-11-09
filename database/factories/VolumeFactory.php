<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Volume::class, function (Faker $faker) {
    return [
        'name' => $faker->company(),
        'media_type_id' => function () {
            return Biigle\MediaType::imageId();
        },
        'creator_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'url' => 'test://files',
    ];
});
