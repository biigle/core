<?php

namespace Database\Factories;

use Biigle\FederatedSearchInstance;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Database\Eloquent\Factories\Factory;

class FederatedSearchModelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'type' => $this->faker->randomElement([
                LabelTree::class,
                Project::class,
                Volume::class,
            ]),
            'name' => $this->faker->company(),
            'url' => $this->faker->url(),
            'federated_search_instance_id' => FederatedSearchInstance::factory(),
        ];
    }
}
