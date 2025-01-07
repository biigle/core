<?php

namespace Biigle\Modules\Reports\Database\Factories;

use Biigle\Modules\Reports\ReportType;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportTypeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ReportType::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->username(),
        ];
    }
}
