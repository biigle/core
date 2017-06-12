<?php

$factory->define(Biigle\Modules\Export\ReportType::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Biigle\Modules\Export\Report::class, function ($faker) {
    if (rand(0, 1) > 0) {
        $sourceType = Biigle\Volume::class;
    } else {
        $sourceType = Biigle\Project::class;
    }

    return [
        'user_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'type_id' => function () {
            return factory(Biigle\Modules\Export\ReportType::class)->create()->id;
        },
        'source_id' => function () use ($sourceType) {
            return factory($sourceType)->create()->id;
        },
        'source_type' => $sourceType,
    ];
});
