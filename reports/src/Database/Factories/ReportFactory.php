<?php

namespace Biigle\Modules\Reports\Database\Factories;

use Biigle\Modules\Reports\Report;
use Biigle\Modules\Reports\ReportType;
use Biigle\User;
use Biigle\Volume;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Report::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'type_id' => function () {
                return ReportType::imageAnnotationsCsvId();
            },
            'source_id' => Volume::factory(),
            'source_type' => Volume::class,
        ];
    }
}
