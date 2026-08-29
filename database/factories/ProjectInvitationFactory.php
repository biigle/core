<?php

namespace Database\Factories;

use Biigle\Project;
use Biigle\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Biigle\ProjectInvitation>
 */
class ProjectInvitationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            'uuid' => $this->faker->unique()->uuid(),
            'expires_at' => now()->addDay(),
            'project_id' => Project::factory(),
            'role_id' => Role::editorId(),
            'current_uses' => 0,
            'add_to_sessions' => false,
        ];
    }
}
