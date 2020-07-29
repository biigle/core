<?php

use Faker\Generator as Faker;

$factory->define(Biigle\VideoLabel::class, function (Faker $faker) {
    return [
        'video_id' => function () {
            return factory(Biigle\Video::class)->create()->id;
        },
        'label_id' => function () {
            return factory(Biigle\Label::class)->create()->id;
        },
        'user_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
    ];
});
