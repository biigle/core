<?php

use Faker\Generator as Faker;

$factory->define(Biigle\ImageLabel::class, function (Faker $faker) {
    return [
        'image_id' => function () {
            return factory(Biigle\Image::class)->create()->id;
        },
        'label_id' => function () {
            return factory(Biigle\Label::class)->create()->id;
        },
        'user_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
    ];
});
