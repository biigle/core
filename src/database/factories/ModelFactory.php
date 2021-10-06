<?php

$factory->define(Biigle\Modules\Reports\ReportType::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Biigle\Modules\Reports\Report::class, function ($faker) {
    return [
        'user_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'type_id' => function () {
            return Biigle\Modules\Reports\ReportType::imageAnnotationsCsvId();
        },
        'source_id' => function () {
            return factory(Biigle\Volume::class)->create()->id;
        },
        'source_type' => Biigle\Volume::class,
    ];
});
