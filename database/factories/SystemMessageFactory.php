<?php

use Faker\Generator as Faker;

$factory->define(Biigle\SystemMessage::class, function (Faker $faker) {
    return [
        'body' => $faker->text(),
        'title' => $faker->sentence(),
        'type_id' => $faker->randomElement([
            Biigle\SystemMessageType::$important->id,
            Biigle\SystemMessageType::$update->id,
            Biigle\SystemMessageType::$info->id,
        ]),
    ];
});
