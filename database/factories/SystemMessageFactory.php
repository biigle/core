<?php

namespace Database\Factories;

use Biigle\SystemMessageType;
use Illuminate\Database\Eloquent\Factories\Factory;

class SystemMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'body' => $this->faker->text(),
            'title' => $this->faker->sentence(),
            'type_id' => function () {
                return $this->faker->randomElement([
                    SystemMessageType::typeImportantId(),
                    SystemMessageType::typeUpdateId(),
                    SystemMessageType::typeInfoId(),
                ]);
            },
        ];
    }
}
