<?php

use Faker\Generator as Faker;

$factory->define(Biigle\LabelTreeVersion::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
        'doi' => $faker->username(),
        'label_tree_id' => function () {
            return factory(Biigle\LabelTree::class)->create()->id;
        },
    ];
});
