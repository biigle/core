<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Project;
use Biigle\ProjectInvitation;
use Biigle\Role;

class ProjectInvitationControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/invitations");

        $this->beUser();
        $this->postJson("/api/v1/projects/{$id}/invitations")->assertStatus(403);

        // missing arguments
        $this->beAdmin();
        $this->postJson("/api/v1/projects/{$id}/invitations")->assertStatus(422);

        // Expiration must be in the future.
        $this->postJson("/api/v1/projects/{$id}/invitations", [
            'expires_at' => '2022-11-09 15:10:00',
        ])->assertStatus(422);

        $this->assertFalse($this->project()->invitations()->exists());

        $timestamp = now()->addDay()->startOfDay();
        $this->postJson("/api/v1/projects/{$id}/invitations", [
            'expires_at' => $timestamp,
        ])->assertSuccessful();

        $invitation = $this->project()->invitations()->first();
        $this->assertNotNull($invitation);
        $this->assertEquals($timestamp, $invitation->expires_at);
        $this->assertEquals(0, $invitation->current_uses);
        $this->assertNotNull($invitation->uuid);
        $this->assertNull($invitation->max_uses);
        $this->assertEquals(Role::editorId(), $invitation->role_id);

    }

    public function testStoreOptionalAttributes()
    {
        $id = $this->project()->id;
        $this->beAdmin();

        $timestamp = now()->addDay();
        // Invited users may not become admins.
        $this->postJson("/api/v1/projects/{$id}/invitations", [
            'expires_at' => $timestamp,
            'role_id' => Role::adminId(),
        ])->assertStatus(422);

        $this->postJson("/api/v1/projects/{$id}/invitations", [
            'expires_at' => $timestamp,
            'role_id' => -1,
        ])->assertStatus(422);

        $this->postJson("/api/v1/projects/{$id}/invitations", [
            'expires_at' => $timestamp,
            'max_uses' => 0,
        ])->assertStatus(422);

        $this->postJson("/api/v1/projects/{$id}/invitations", [
            'expires_at' => $timestamp,
            'role_id' => Role::guestId(),
            'max_uses' => 10,
        ])->assertSuccessful();

        $invitation = $this->project()->invitations()->first();
        $this->assertNotNull($invitation);
        $this->assertEquals(10, $invitation->max_uses);
        $this->assertEquals(Role::guestId(), $invitation->role_id);
    }

    public function testDestroy()
    {
        $invitation = ProjectInvitation::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $id = $invitation->id;
        $this->doTestApiRoute('DELETE', "/api/v1/project-invitations/{$id}");

        $this->beEditor();
        $this->deleteJson("/api/v1/project-invitations/{$id}")->assertStatus(403);

        $this->beAdmin();
        $this->deleteJson("/api/v1/project-invitations/{$id}")->assertSuccessful();

        $this->assertNull($invitation->fresh());
    }
}
