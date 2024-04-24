<?php

namespace Database\Factories;

use Biigle\MediaType;
use Biigle\PendingVolume;
use Biigle\Project;
use Biigle\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @template TModel of \Biigle\PendingVolume
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<TModel>
 */
class PendingVolumeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<TModel>
     */
    protected $model = PendingVolume::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'media_type_id' => fn () => MediaType::imageId(),
            'user_id' => User::factory(),
            'project_id' => Project::factory(),
        ];
    }
}
