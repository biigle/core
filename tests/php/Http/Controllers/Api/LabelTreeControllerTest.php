<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\AnnotationLabelTest;

class LabelTreeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/label-trees');

        $this->beUser();
        $tree = $this->labelTree();
        $this->get('/api/v1/label-trees')->assertJsonFragment([
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'created_at' => (string) $tree->created_at,
            'updated_at' => (string) $tree->updated_at,
        ]);
    }

    public function testIndexPrivate()
    {
        $tree = $this->labelTree();
        $tree->visibility_id = Visibility::$private->id;
        $tree->save();

        $this->beUser();
        $this->get('/api/v1/label-trees')->assertExactJson([]);
        $this->beGlobalAdmin();
        $this->get('/api/v1/label-trees')->assertJsonFragment([
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'created_at' => (string) $tree->created_at,
            'updated_at' => (string) $tree->updated_at,
        ]);
    }

    public function testShow()
    {
        $tree = LabelTreeTest::create([
            'name' => '123',
            'description' => '123',
            'visibility_id' => Visibility::$private->id,
        ]);

        $label = LabelTest::create([
            'label_tree_id' => $tree->id,
        ]);

        $tree->addMember($this->editor(), Role::$editor);

        $this->doTestApiRoute('GET', "/api/v1/label-trees/{$tree->id}");

        $this->beUser();
        $response = $this->get("/api/v1/label-trees/{$tree->id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->get("/api/v1/label-trees/{$tree->id}")
        ->assertJsonFragment([
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'created_at' => (string) $tree->created_at,
            'updated_at' => (string) $tree->updated_at,
        ])
        ->assertJsonFragment([
            'id' => $label->id,
            'name' => $label->name,
            'parent_id' => $label->parent_id,
            'label_tree_id' => $tree->id,
        ])
        ->assertJsonFragment([
            'id' => $this->editor()->id,
            'firstname' => $this->editor()->firstname,
            'lastname' => $this->editor()->lastname,
            'role_id' => Role::$editor->id,
        ]);
    }

    public function testUpdate()
    {
        $tree = LabelTreeTest::create([
            'name' => '123',
            'description' => '123',
            'visibility_id' => Visibility::$private->id,
        ]);
        $id = $tree->id;
        $tree->addMember($this->editor(), Role::$editor);
        $tree->addMember($this->admin(), Role::$admin);

        $this->doTestApiRoute('PUT', "/api/v1/label-trees/{$id}");

        // non-admins are not allowed to update
        $this->beEditor();
        $response = $this->put("/api/v1/label-trees/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->put('/api/v1/label-trees/999');
        $response->assertStatus(404);

        $response = $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'name' => '',
        ]);
        // name must not be empty if it is present
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'visibility_id' => 999,
        ]);
        // visibility must exist
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'name' => 'my test',
        ]);
        $response->assertStatus(200);

        $this->assertEquals('my test', $tree->fresh()->name);

        $response = $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'description' => 'this is my test',
        ]);
        $response->assertStatus(200);

        $this->assertEquals('this is my test', $tree->fresh()->description);

        $response = $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'visibility_id' => Visibility::$public->id,
        ]);
        $response->assertStatus(200);

        $this->assertEquals(Visibility::$public->id, $tree->fresh()->visibility_id);
    }

    public function testUpdateFormRequest()
    {
        $tree = LabelTreeTest::create([
            'name' => '123',
            'description' => '123',
            'visibility_id' => Visibility::$private->id,
        ]);
        $id = $tree->id;
        $tree->addMember($this->user(), Role::$admin);
        $this->beUser();
        $this->get('/');
        $response = $this->put("/api/v1/label-trees/{$id}", [
            'name' => 'abc',
        ]);
        $this->assertEquals('abc', $tree->fresh()->name);
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);

        $response = $this->put("/api/v1/label-trees/{$id}", [
            'description' => 'abc',
            '_redirect' => 'settings',
        ]);
        $this->assertEquals('abc', $tree->fresh()->description);
        $response->assertRedirect('/settings');
        $response->assertSessionHas('saved', true);
    }

    public function testUpdateVisibility()
    {
        $tree = LabelTreeTest::create([
            'name' => '123',
            'description' => '123',
            'visibility_id' => Visibility::$public->id,
        ]);
        $id = $tree->id;
        $tree->addMember($this->admin(), Role::$admin);
        $unauthorized = ProjectTest::create();
        $authorized = ProjectTest::create();
        $tree->authorizedProjects()->attach($authorized->id);
        $tree->projects()->attach([$authorized->id, $unauthorized->id]);

        $this->beAdmin();
        $response = $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'visibility_id' => strval(Visibility::$private->id),
        ]);

        // the IDs may be strings when testing with sqlite
        $this->assertEquals([$authorized->id], array_map('intval', $tree->projects()->pluck('id')->all()));
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/label-trees');

        $this->beUser();
        $response = $this->json('POST', '/api/v1/label-trees');
        // creating an empty project is an error
        $response->assertStatus(422);

        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
        ]);
        // visibility is required
        $response->assertStatus(422);

        $response = $this->json('POST', '/api/v1/label-trees', [
            'visibility_id' => Visibility::$public->id,
        ]);
        // name is required
        $response->assertStatus(422);

        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => 9999,
        ]);
        // visibility must exist
        $response->assertStatus(422);

        $this->assertEquals(0, LabelTree::count());

        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
        ]);
        // description is optional
        $response->assertStatus(200);

        $this->assertEquals(1, LabelTree::count());

        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            // make ID a string so seeJsonEquals works
            'visibility_id' => ''.Visibility::$public->id,
            'description' => 'my description',
        ]);
        $response->assertStatus(200);

        $this->assertEquals(2, LabelTree::count());

        $tree = LabelTree::orderBy('id', 'desc')->first();
        $this->assertNotNull($tree->uuid);
        $response->assertExactJson($tree->toArray());

        // creator gets first label tree admin
        $member = $tree->members()->find($this->user()->id);
        $this->assertNotNull($member);
        $this->assertEquals(Role::$admin->id, $member->role_id);
    }

    public function testStoreTargetProject()
    {
        $this->beEditor();
        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
            'description' => 'my description',
            'project_id' => $this->project()->id,
        ]);
        // User has no permission to create a tree for that project. Thus the project_id
        // is 'invalid'.
        $response->assertStatus(422);

        $this->beAdmin();
        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
            'description' => 'my description',
            'project_id' => 999,
        ]);
        $response->assertStatus(422);

        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
            'description' => 'my description',
            'project_id' => $this->project()->id,
        ]);
        $response->assertStatus(200);
        $tree = LabelTree::first();
        $this->assertEquals($this->project()->id, $tree->projects()->first()->id);
        $this->assertEquals($this->project()->id, $tree->authorizedProjects()->first()->id);
    }

    public function testStoreFormRequest()
    {
        $this->beUser();
        $this->get('/');
        $response = $this->post('/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
            'description' => 'my description',
        ]);
        $this->assertEquals(1, LabelTree::count());

        $response = $this->post('/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
            'description' => 'my description',
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(2, LabelTree::count());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('newTree');
    }

    public function testDestroy()
    {
        $tree = $this->labelTree();
        $id = $tree->id;
        $tree->addMember($this->editor(), Role::$editor);
        $tree->addMember($this->admin(), Role::$admin);

        $this->doTestApiRoute('DELETE', "/api/v1/label-trees/{$id}");

        // non-admins are not allowed to update
        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$id}");
        $response->assertStatus(403);

        // make sure the tree has a label that is used somewhere
        $a = AnnotationLabelTest::create(['label_id' => $this->labelRoot()->id]);

        $this->beAdmin();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$id}");
        // can't be deleted if a label is still in use
        $response->assertStatus(403);

        $a->delete();

        $this->assertNotNull($tree->fresh());
        $response = $this->json('DELETE', "/api/v1/label-trees/{$id}");
        $response->assertStatus(200);
        $this->assertNull($tree->fresh());
    }

    public function testDestroyFormRequest()
    {
        $tree = LabelTreeTest::create();
        $id = $tree->id;
        $tree->addMember($this->admin(), Role::$admin);

        $this->beAdmin();
        $this->get('/');
        $response = $this->delete("/api/v1/label-trees/{$id}");
        $this->assertNull($tree->fresh());
        $response->assertRedirect('/');
        $response->assertSessionHas('deleted', true);

        $tree = LabelTreeTest::create();
        $id = $tree->id;
        $tree->addMember($this->admin(), Role::$admin);

        $response = $this->delete("/api/v1/label-trees/{$id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertNull($tree->fresh());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('deleted', true);
    }
}
