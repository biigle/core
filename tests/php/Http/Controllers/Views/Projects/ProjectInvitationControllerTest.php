<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

use Biigle\ProjectInvitation;
use Biigle\Role;
use Biigle\User;
use TestCase;

class ProjectInvitationControllerTest extends TestCase
{
    public function testShow()
    {
        $user = User::factory()->create();
        $invitation = ProjectInvitation::factory()->create();

        $this->be($user);
        $this->get("project-invitations/{$invitation->id}")->assertStatus(404);

        $this->get("project-invitations/{$invitation->uuid}")->assertStatus(200);
    }

    public function testShowNotLoggedInSignUpDisabled()
    {
        $invitation = ProjectInvitation::factory()->create();
        $this->get("project-invitations/{$invitation->uuid}")
            ->assertRedirect('login')
            ->assertSessionHas('url.intended', "http://localhost:8000/project-invitations/{$invitation->uuid}");
    }

    public function testShowNotLoggedInSignUpEnabled()
    {
        config(['biigle.user_registration' => true]);

        $invitation = ProjectInvitation::factory()->create();
        $this->get("project-invitations/{$invitation->uuid}")
            ->assertRedirect('register')
            ->assertSessionHas('url.intended', "http://localhost:8000/project-invitations/{$invitation->uuid}");
    }

    public function testShowAlreadyMember()
    {
        $user = User::factory()->create();
        $invitation = ProjectInvitation::factory()->create();
        $invitation->project->addUserId($user->id, Role::editorId());
        $this->be($user);
        $this->get("project-invitations/{$invitation->uuid}")
            ->assertRedirect("projects/{$invitation->project->id}")
            ->assertSessionHas('message', 'You are already a member of the project.')
            ->assertSessionHas('messageType', 'info');
    }
}
