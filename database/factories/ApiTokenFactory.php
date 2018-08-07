<?php

use Faker\Generator as Faker;

$factory->define(Biigle\ApiToken::class, function (Faker $faker) {
    return [
        'owner_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'purpose' => $faker->sentence(),
        // 'password'
        'hash' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
    ];
});
