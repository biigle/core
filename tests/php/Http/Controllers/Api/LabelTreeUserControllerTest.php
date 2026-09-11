<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Role;
use Biigle\Tests\LabelTreeTest;

class LabelTreeUserControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        $t = LabelTreeTest::create();
        $t->addMember($this->editor(), Role::EDITOR);
        $u = $this->editor();
        $t->addMember($this->admin(), Role::ADMIN);

        $this->doTestApiRoute('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}");

        // non-admins are not allowed to update
        $this->beEditor();
        $response = $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => 999,
        ]);
        $response->assertStatus(422);

        $id = $this->admin()->id;

        $response = $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$id}", [
            'role_id' => Role::ADMIN->value,
        ]);
        // cannot update the own user
        $response->assertStatus(403);

        $this->assertSame(1, $t->members()->where('label_tree_user.role_id', Role::ADMIN->value)->count());
        $response = $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::ADMIN->value,
        ]);
        $response->assertStatus(200);
        $this->assertSame(2, $t->members()->where('label_tree_user.role_id', Role::ADMIN->value)->count());

        $response = $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::EDITOR->value,
        ]);
        $response->assertStatus(200);
        $this->assertSame(1, $t->members()->where('label_tree_user.role_id', Role::ADMIN->value)->count());
    }

    public function testUpdateGlobalGuest()
    {
        $t = LabelTreeTest::create();
        $u = $this->globalGuest();
        $t->addMember($this->user(), Role::ADMIN);
        $t->addMember($u, Role::EDITOR);
        $this->beUser();
        $this->json('PUT', "/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::ADMIN->value,
        ])->assertStatus(422);
    }

    public function testUpdateFormRequest()
    {
        $t = LabelTreeTest::create();
        $t->addMember($this->editor(), Role::EDITOR);
        $u = $this->editor();
        $t->addMember($this->admin(), Role::ADMIN);

        $this->beAdmin();
        $this->get('/');
        $response = $this->put("/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::ADMIN->value,
        ]);
        $this->assertSame(2, $t->members()->where('label_tree_user.role_id', Role::ADMIN->value)->count());
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);

        $response = $this->put("/api/v1/label-trees/{$t->id}/users/{$u->id}", [
            'role_id' => Role::EDITOR->value,
            '_redirect' => 'settings',
        ]);
        $this->assertSame(1, $t->members()->where('label_tree_user.role_id', Role::ADMIN->value)->count());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('saved', true);
    }

    public function testStore()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::EDITOR);
        $tree->addMember($this->admin(), Role::ADMIN);

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/users");

        $this->beUser();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/users");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/users");
        $response->assertStatus(403);

        $this->beAdmin();

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
        ]);
        // role_id is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'role_id' => Role::EDITOR->value,
        ]);
        // id is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
            'role_id' => Role::GUEST->value,
        ]);
        // wrong role
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->admin()->id,
            'role_id' => Role::ADMIN->value,
        ]);
        // is already user
        $response->assertStatus(422);

        $this->assertFalse($tree->members()->where('id', $this->user()->id)->exists());
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
            'role_id' => Role::EDITOR->value,
        ]);
        $response->assertStatus(200);
        $user = $tree->members()->find($this->user()->id);
        $this->assertNotNull($user);
        $this->assertSame(Role::EDITOR->value, $user->role_id->value);
    }

    public function testStoreGlobalGuest()
    {
        $t = LabelTreeTest::create();
        $t->addMember($this->user(), Role::ADMIN);
        $this->beUser();
        $this->json('POST', "/api/v1/label-trees/{$t->id}/users", [
            'id' => $this->globalGuest()->id,
            'role_id' => Role::ADMIN->value,
        ])->assertStatus(422);

        $this->json('POST', "/api/v1/label-trees/{$t->id}/users", [
            'id' => $this->globalGuest()->id,
            'role_id' => Role::EDITOR->value,
        ])->assertStatus(200);
    }

    public function testStoreFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->admin(), Role::ADMIN);
        $this->beAdmin();
        $this->get('/');
        $response = $this->post("/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->user()->id,
            'role_id' => Role::EDITOR->value,
        ]);
        $this->assertSame(2, $tree->members()->count());
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);

        $response = $this->post("/api/v1/label-trees/{$tree->id}/users", [
            'id' => $this->guest()->id,
            'role_id' => Role::EDITOR->value,
            '_redirect' => 'settings',
        ]);
        $this->assertSame(3, $tree->members()->count());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('saved', true);
    }

    public function testDestroy()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::EDITOR);
        $editor = $this->editor();
        $tree->addMember($this->admin(), Role::ADMIN);
        $admin = $this->admin();

        $this->doTestApiRoute('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");

        // not a member
        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $response->assertStatus(403);

        // can only delete themselves
        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$admin->id}");
        $response->assertStatus(403);

        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $response->assertStatus(200);
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());

        $tree->addMember($this->editor(), Role::EDITOR);

        // only admin cannot be removed
        $this->beAdmin();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$admin->id}");
        $response->assertStatus(403);

        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $response->assertStatus(200);
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());

        // global admin can remove even the last admin of the label tree
        $this->beGlobalAdmin();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/users/{$admin->id}");
        $response->assertStatus(200);
    }

    public function testDestroyFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::EDITOR);
        $editor = $this->editor();
        $tree->addMember($this->admin(), Role::ADMIN);

        $this->beAdmin();
        $this->get('/');
        $response = $this->delete("/api/v1/label-trees/{$tree->id}/users/{$editor->id}");
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());
        $response->assertRedirect('/');
        $response->assertSessionHas('deleted', true);

        $tree->addMember($this->editor(), Role::EDITOR);

        $response = $this->delete("/api/v1/label-trees/{$tree->id}/users/{$editor->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertFalse($tree->members()->where('id', $editor->id)->exists());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('deleted', true);
    }
}
