<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Project;
use Biigle\Role;

class ProjectUserControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/users");

        // the user doesn't belong to this project
        $this->beUser();
        $response = $this->get("/api/v1/projects/{$id}/users");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("/api/v1/projects/{$id}/users");
        $content = $response->getContent();
        $response->assertStatus(200);

        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
        $this->assertStringContainsString('"firstname":"'.$this->admin()->firstname.'"', $content);
        $this->assertStringContainsString('"lastname":"'.$this->admin()->lastname.'"', $content);
        $this->assertStringNotContainsString('"email":"'.$this->admin()->email.'"', $content);
        $this->assertStringContainsString('project_role_id', $content);
        $this->assertStringNotContainsString('pivot', $content);
    }

    public function testUpdate()
    {
        // create admin
        $this->admin();
        // the creator is also admin and shouldn't interfere with these tests
        $this->project()->creator->delete();

        $id = $this->project()->id;
        $this->doTestApiRoute('PUT', "/api/v1/projects/{$id}/users/1");

        // non-admins are not allowed to modify users
        $this->beUser();
        $response = $this->put("/api/v1/projects/{$id}/users/".$this->guest()->id);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put("/api/v1/projects/{$id}/users/".$this->guest()->id);
        $response->assertStatus(403);

        // user doesn't exist
        $this->beAdmin();
        $response = $this->put("/api/v1/projects/{$id}/users/0");
        $response->assertStatus(404);

        // missing arguments
        $response = $this->putJson("/api/v1/projects/{$id}/users/".$this->editor()->id);
        $response->assertStatus(422);

        // role does not exist
        $response = $this->
        putJson("/api/v1/projects/{$id}/users/".$this->editor()->id, [
            'project_role_id' => 100,
        ]);
        $response->assertStatus(422);

        // last admin cannot be removed
        $this
            ->putJson("/api/v1/projects/{$id}/users/".$this->admin()->id, [
                'project_role_id' => Role::guestId(),
            ])
            ->assertStatus(422)
            ->assertJsonFragment(['The last admin of '.$this->project()->name.' cannot be removed. The admin status must be passed on to another user first.']);

        $this->assertEquals(2, $this->project()->users()->find($this->editor()->id)->project_role_id);

        $response = $this->put("/api/v1/projects/{$id}/users/".$this->editor()->id, [
            'project_role_id' => Role::guestId(),
        ]);

        $response->assertStatus(200);
        $this->assertEquals(3, $this->project()->users()->find($this->editor()->id)->project_role_id);
    }

    public function testUpdateGlobalGuest()
    {
        $pid = $this->project()->id;
        $id = $this->globalGuest()->id;

        $this->project()->addUserId($id, Role::guestId());

        $this->beAdmin();
        $this
            ->putJson("/api/v1/projects/{$pid}/users/{$id}", [
                'project_role_id' => Role::editorId(),
            ])->assertStatus(200);

        $this
            ->putJson("/api/v1/projects/{$pid}/users/{$id}", [
                'project_role_id' => Role::expertId(),
            ])->assertStatus(200);

        $this
            ->putJson("/api/v1/projects/{$pid}/users/{$id}", [
                'project_role_id' => Role::adminId(),
            ])->assertStatus(422);
    }

    public function testAttach()
    {
        $pid = $this->project()->id;
        $id = $this->user()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/users/{$id}");

        $this->beUser();
        $response = $this->postJson("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(403);

        // missing arguments
        $this->beAdmin();
        $response = $this->postJson("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(422);

        // non-admins are not allowed to add users
        $this->beEditor();
        $response = $this->postJson("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(403);

        $this->assertNull($this->project()->fresh()->users()->find($id));

        $this->beAdmin();
        // missing arguments
        $response = $this->postJson("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(422);

        $response = $this->postJson("/api/v1/projects/{$pid}/users/{$id}", [
            'project_role_id' => 2,
        ]);

        $response->assertStatus(200);
        $newUser = $this->project()->users()->find($id);
        $this->assertEquals($id, $newUser->id);
        $this->assertEquals(Role::editorId(), $newUser->project_role_id);
    }

    public function testAttachGlobalGuest()
    {
        $pid = $this->project()->id;
        $id = $this->globalGuest()->id;

        $this->beAdmin();
        $this
            ->postJson("/api/v1/projects/{$pid}/users/{$id}", [
                'project_role_id' => Role::editorId(),
            ])->assertStatus(200);

        $this->project()->removeUserId($id);

        $this
            ->postJson("/api/v1/projects/{$pid}/users/{$id}", [
                'project_role_id' => Role::expertId(),
            ])->assertStatus(200);

        $this->project()->removeUserId($id);

        $this
            ->postJson("/api/v1/projects/{$pid}/users/{$id}", [
                'project_role_id' => Role::adminId(),
            ])->assertStatus(422);
    }

    public function testDestroy()
    {
        // create admin
        $this->admin();
        // creator is an admin and shouldn't play a role in this test
        $this->project()->creator->delete();
        $id = $this->project()->id;

        // token mismatch
        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$id}/users/1");

        // non-admins are not allowed to delete other users
        $this->beEditor();
        $response = $this->delete("/api/v1/projects/{$id}/users/".$this->admin()->id);
        $response->assertStatus(403);

        // but they can delete themselves
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $response = $this->delete("/api/v1/projects/{$id}/users/".$this->editor()->id);
        $response->assertStatus(200);
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::editorId());

        // admins can delete anyone
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->beAdmin();
        $response = $this->delete("/api/v1/projects/{$id}/users/".$this->editor()->id);
        $response->assertStatus(200);
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::editorId());

        // but admins cannot delete themselves if they are the only admin left
        $response = $this->deleteJson("/api/v1/projects/{$id}/users/".$this->admin()->id);
        $response->assertStatus(422);
    }
}
