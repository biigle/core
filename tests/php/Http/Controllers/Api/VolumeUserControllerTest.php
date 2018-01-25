<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
use Biigle\Tests\VolumeTest;

class VolumeUserControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $v = VolumeTest::create();
        $v->addMember($this->admin(), Role::$admin);

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$v->id}/users");

        $this->beUser();
        $response = $this->json('POST', "/api/v1/volumes/{$v->id}/users");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/volumes/{$v->id}/users");
        // id is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$v->id}/users", [
            'id' => $this->admin()->id,
        ]);
        // is already user
        $response->assertStatus(422);

        $this->assertFalse($v->members()->where('id', $this->user()->id)->exists());
        $response = $this->json('POST', "/api/v1/volumes/{$v->id}/users", [
            'id' => $this->user()->id,
        ]);
        $response->assertStatus(200);
        $user = $v->members()->find($this->user()->id);
        $this->assertNotNull($user);
        $this->assertEquals(Role::$admin->id, $user->role_id);
    }

    public function testDestroy()
    {
        $v = VolumeTest::create();
        $v->addMember($this->editor(), Role::$admin);
        $editor = $this->editor();
        $admin = $v->creator;

        $this->doTestApiRoute('DELETE', "/api/v1/volumes/{$v->id}/users/{$editor->id}");

        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/volumes/{$v->id}/users/{$editor->id}");
        $response->assertStatus(403);

        $this->be($admin);
        $response = $this->json('DELETE', "/api/v1/volumes/{$v->id}/users/{$editor->id}");
        $response->assertStatus(200);
        $this->assertFalse($v->members()->where('id', $editor->id)->exists());

        // Last admin cannot be removed.
        $response = $this->json('DELETE', "/api/v1/volumes/{$v->id}/users/{$admin->id}");
        $response->assertStatus(403);

        // Even the global admin cannot remove the last volume admin.
        $this->beGlobalAdmin();
        $response = $this->json('DELETE', "/api/v1/volumes/{$v->id}/users/{$admin->id}");
        $response->assertStatus(403);
    }
}
