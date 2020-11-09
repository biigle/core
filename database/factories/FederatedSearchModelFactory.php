<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use Biigle\FederatedSearchInstance;
use Biigle\FederatedSearchModel;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Volume;
use Faker\Generator as Faker;

$factory->define(FederatedSearchModel::class, function (Faker $faker) {
    return [
        'type' => $faker->randomElement([
            LabelTree::class,
            Project::class,
            Volume::class,
        ]),
        'name' => $faker->company(),
        'url' => $faker->url(),
        'federated_search_instance_id' => function ($faker) {
            return factory(Biigle\FederatedSearchInstance::class)->create()->id;
        },
    ];
});
