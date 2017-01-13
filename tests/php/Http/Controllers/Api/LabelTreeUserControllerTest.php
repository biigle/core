<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
use Biigle\Tests\LabelTreeTest;

class LabelTreeUserControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        $t = LabelTreeTest::create();
        $t->addMember($this->editor(), Role::$editor);
        $u = $this->editor();
        $t->addMember($this->admin(), Role::$admin);

        $this->doTestApiRoute('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}");

        // non-admins are not allowed to update
        $this->beEditor();
        $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => 999,
        ]);
        $this->assertResponseStatus(422);

        $id = $this->admin()->id;

        $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$id}", [
            'role_id' => Role::$admin->id,
        ]);
        // cannot update the own user
        $this->assertResponseStatus(403);

        $this->assertEquals(1, $t->members()->where('label_tree_user.role_id', Role::$admin->id)->count());
        $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::$admin->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(2, $t->members()->where('label_tree_user.role_id', Role::$admin->id)->count());

        $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::$editor->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(1, $t->members()->where('label_tree_user.role_id', Role::$admin->id)->count());
    }

    public function testUpdateFormRequest()
    {
        $t = LabelTreeTest::create();
        $t->addMember($this->editor(), Role::$editor);
        $u = $this->editor();
        $t->addMember($this->admin(), Role::$admin);

        $this->beAdmin();
        $this->visit('/');
        $this->put("/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::$admin->id,
        ]);
        $this->assertEquals(2, $t->members()->where('label_tree_user.role_id', Role::$admin->id)->count());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);

        $this->put("/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::$editor->id,
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(1, $t->members()->where('label_tree_user.role_id', Role::$admin->id)->count());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('saved', true);
    }

    public function testStore()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);
        $tree->addMember($this->admin(), Role::$admin);

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/users");

        $this->beUser();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/users");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/users");
        $this->assertResponseStatus(403);

        $this->beAdmin();

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
        ]);
        // role_id is required
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'role_id' => Role::$editor->id,
        ]);
        // id is required
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
            'role_id' => Role::$guest->id,
        ]);
        // wrong role
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->admin()->id,
            'role_id' => Role::$admin->id,
        ]);
        // is already user
        $this->assertResponseStatus(422);

        $this->assertFalse($tree->members()->where('id', $this->user()->id)->exists());
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
            'role_id' => Role::$editor->id,
        ]);
        $this->assertResponseOk();
        $user = $tree->members()->find($this->user()->id);
        $this->assertNotNull($user);
        $this->assertEquals(Role::$editor->id, $user->role_id);
    }

    public function testStoreFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->admin(), Role::$admin);
        $this->beAdmin();
        $this->visit('/');
        $this->post("/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
            'role_id' => Role::$editor->id,
        ]);
        $this->assertEquals(2, $tree->members()->count());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);

        $this->post("/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->guest()->id,
            'role_id' => Role::$editor->id,
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(3, $tree->members()->count());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('saved', true);
    }

    public function testDestroy()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);
        $editor = $this->editor();
        $tree->addMember($this->admin(), Role::$admin);
        $admin = $this->admin();

        $this->doTestApiRoute('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");

        // not a member
        $this->beUser();
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $this->assertResponseStatus(403);

        // can only delete themselves
        $this->beEditor();
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$admin->id}");
        $this->assertResponseStatus(403);

        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $this->assertResponseOk();
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());

        $tree->addMember($this->editor(), Role::$editor);

        // only admin cannot be removed
        $this->beAdmin();
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$admin->id}");
        $this->assertResponseStatus(403);

        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $this->assertResponseOk();
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());

        // global admin can remove even the last admin of the label tree
        $this->beGlobalAdmin();
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$admin->id}");
        $this->assertResponseOk();
    }

    public function testDestroyFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);
        $editor = $this->editor();
        $tree->addMember($this->admin(), Role::$admin);

        $this->beAdmin();
        $this->visit('/');
        $this->delete("/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('deleted', true);

        $tree->addMember($this->editor(), Role::$editor);

        $this->delete("/api/v1/label-trees/{$tree->id}/users/{$editor->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('deleted', true);
    }
}
