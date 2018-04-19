<?php

use Faker\Generator as Faker;

$factory->define(Biigle\Label::class, function (Faker $faker) {
    return [
        'name' => $faker->username(),
        'color' => '0099ff',
        'parent_id' => null,
        'label_tree_id' => function () {
            return factory(Biigle\LabelTree::class)->create()->id;
        },
        'uuid' => $faker->unique()->uuid(),
    ];
});
