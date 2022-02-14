<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\LabelTree;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\ProjectTest;
use Biigle\Visibility;
use Cache;

class LabelTreeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/label-trees');

        $this->beUser();
        $tree = $this->labelTree();
        $this->get('/api/v1/label-trees')->assertJsonFragment([[
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'created_at' => $tree->created_at->toJson(),
            'updated_at' => $tree->updated_at->toJson(),
            'version' => null,
        ]]);
    }

    public function testIndexPrivate()
    {
        $tree = $this->labelTree();
        $tree->visibility_id = Visibility::privateId();
        $tree->save();

        $this->beUser();
        $this->get('/api/v1/label-trees')->assertExactJson([]);
        $this->beGlobalAdmin();
        $this->get('/api/v1/label-trees')->assertJsonFragment([[
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'created_at' => $tree->created_at->toJson(),
            'updated_at' => $tree->updated_at->toJson(),
            'version' => null,
        ]]);
    }

    public function testIndexVersion()
    {
        $this->doTestApiRoute('GET', '/api/v1/label-trees');

        $this->beUser();
        $version = LabelTreeVersionTest::create();
        $tree = $this->labelTree();
        $tree->version_id = $version->id;
        $tree->save();
        $this->get('/api/v1/label-trees')->assertJsonFragment([[
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'created_at' => $tree->created_at->toJson(),
            'updated_at' => $tree->updated_at->toJson(),
            'version' => $version->toArray(),
        ]]);
    }

    public function testShow()
    {
        $tree = LabelTreeTest::create([
            'name' => '123',
            'description' => '123',
            'visibility_id' => Visibility::privateId(),
        ]);

        $label = LabelTest::create([
            'label_tree_id' => $tree->id,
        ]);

        $tree->addMember($this->editor(), Role::editor());

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
            'created_at' => $tree->created_at->toJson(),
            'updated_at' => $tree->updated_at->toJson(),
            'version' => null,
            'versions' => [],
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
            'role_id' => Role::editorId(),
        ]);
    }

    public function testUpdate()
    {
        $tree = LabelTreeTest::create([
            'name' => '123',
            'description' => '123',
            'visibility_id' => Visibility::privateId(),
        ]);
        $id = $tree->id;
        $tree->addMember($this->editor(), Role::editor());
        $tree->addMember($this->admin(), Role::admin());

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
            'visibility_id' => Visibility::publicId(),
        ]);
        $response->assertStatus(200);

        $this->assertEquals(Visibility::publicId(), $tree->fresh()->visibility_id);
    }

    public function testUpdateFormRequest()
    {
        $tree = LabelTreeTest::create([
            'name' => '123',
            'description' => '123',
            'visibility_id' => Visibility::privateId(),
        ]);
        $id = $tree->id;
        $tree->addMember($this->user(), Role::admin());
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
            'visibility_id' => Visibility::publicId(),
        ]);
        $id = $tree->id;
        $tree->addMember($this->admin(), Role::admin());
        $unauthorized = ProjectTest::create();
        $authorized = ProjectTest::create();
        $tree->authorizedProjects()->attach($authorized->id);
        $tree->projects()->attach([$authorized->id, $unauthorized->id]);

        $this->beAdmin();
        $response = $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'visibility_id' => strval(Visibility::privateId()),
        ]);

        $this->assertEquals($authorized->id, $tree->projects()->pluck('id')->first());
    }

    public function testUpdatePropagateVisibility()
    {
        $master = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $version = LabelTreeVersionTest::create(['label_tree_id' => $master->id]);
        $tree = LabelTreeTest::create([
            'version_id' => $version->id,
            'visibility_id' => Visibility::privateId(),
        ]);
        $master->addMember($this->admin(), Role::admin());
        $this->beAdmin();
        $this->putJson("/api/v1/label-trees/{$master->id}", [
                'visibility_id' => Visibility::publicId(),
            ])
            ->assertStatus(200);

        $this->assertEquals(Visibility::publicId(), $tree->fresh()->visibility_id);
    }

    public function testUpdatePropagateName()
    {
        $master = LabelTreeTest::create(['name' => 'My Tree']);
        $version = LabelTreeVersionTest::create(['label_tree_id' => $master->id]);
        $tree = LabelTreeTest::create([
            'version_id' => $version->id,
            'name' => 'My Tree',
        ]);
        $master->addMember($this->admin(), Role::admin());
        $this->beAdmin();
        $this->putJson("/api/v1/label-trees/{$master->id}", [
                'name' => 'My Cool Tree',
            ])
            ->assertStatus(200);

        $this->assertEquals('My Cool Tree', $tree->fresh()->name);
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
            'visibility_id' => Visibility::publicId(),
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
            'visibility_id' => Visibility::publicId(),
        ]);
        // description is optional
        $response->assertSuccessful();

        $this->assertEquals(1, LabelTree::count());

        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            // make ID a string so seeJsonEquals works
            'visibility_id' => ''.Visibility::publicId(),
            'description' => 'my description',
        ]);
        $response->assertSuccessful();

        $this->assertEquals(2, LabelTree::count());

        $tree = LabelTree::orderBy('id', 'desc')->first();
        $this->assertNotNull($tree->uuid);
        $response->assertExactJson($tree->toArray());

        // creator gets first label tree admin
        $member = $tree->members()->find($this->user()->id);
        $this->assertNotNull($member);
        $this->assertEquals(Role::adminId(), $member->role_id);
    }

    public function testStoreAuthorization()
    {
        $this->beGlobalGuest();
        $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::publicId(),
        ])->assertStatus(403);

        $this->beUser();
        $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::publicId(),
        ])->assertSuccessful();

        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::publicId(),
        ])->assertSuccessful();
    }

    public function testStoreTargetProject()
    {
        $this->beEditor();
        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::publicId(),
            'description' => 'my description',
            'project_id' => $this->project()->id,
        ]);
        // User has no permission to create a tree for that project. Thus the project_id
        // is 'invalid'.
        $response->assertStatus(422);

        $this->beAdmin();
        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::publicId(),
            'description' => 'my description',
            'project_id' => 999,
        ]);
        $response->assertStatus(422);

        $response = $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::publicId(),
            'description' => 'my description',
            'project_id' => $this->project()->id,
        ]);
        $response->assertSuccessful();
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
            'visibility_id' => Visibility::publicId(),
            'description' => 'my description',
        ]);
        $this->assertEquals(1, LabelTree::count());

        $response = $this->post('/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::publicId(),
            'description' => 'my description',
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(2, LabelTree::count());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('newTree');
    }

    public function testStoreFork()
    {
        $baseTree = LabelTreeTest::create([
            'visibility_id' => Visibility::privateId(),
        ]);
        $baseParent = LabelTest::create(['label_tree_id' => $baseTree->id]);
        $baseChild = LabelTest::create([
            'label_tree_id' => $baseTree->id,
            'parent_id' => $baseParent->id,
        ]);

        $this->beEditor();
        $this->postJson('/api/v1/label-trees', [
                'upstream_label_tree_id' => $baseTree->id,
                'name' => 'abc',
                'visibility_id' => Visibility::publicId(),
                'description' => 'my description',
            ])
            // No access to private label tree.
            ->assertStatus(422);

        $baseTree->addMember($this->editor(), Role::editor());
        Cache::flush();

        $this->postJson('/api/v1/label-trees', [
                'upstream_label_tree_id' => $baseTree->id,
                'name' => 'abc',
                'visibility_id' => Visibility::publicId(),
                'description' => 'my description',
            ])
            // Members can fork private trees.
            ->assertSuccessful();

        $this->beGuest();
        $baseTree->visibility_id = Visibility::publicId();
        $baseTree->save();
        $this->postJson('/api/v1/label-trees', [
                'upstream_label_tree_id' => $baseTree->id,
                'name' => 'abc',
                'visibility_id' => Visibility::publicId(),
                'description' => 'my description',
            ])
            // Everybody can fork public trees.
            ->assertSuccessful();

        $tree = LabelTree::orderBy('id', 'desc')->first();
        $this->assertEquals('abc', $tree->name);
        $this->assertEquals('my description', $tree->description);
        $this->assertTrue($tree->members()->where('id', $this->guest()->id)->exists());
        $parent = $tree->labels()->where('name', $baseParent->name)->first();
        $this->assertNotNull($parent);
        $child = $tree->labels()->where('name', $baseChild->name)->first();
        $this->assertNotNull($child);
        $this->assertEquals($parent->id, $child->parent_id);
    }

    public function testDestroy()
    {
        $tree = $this->labelTree();
        $id = $tree->id;
        $tree->addMember($this->editor(), Role::editor());
        $tree->addMember($this->admin(), Role::admin());

        $this->doTestApiRoute('DELETE', "/api/v1/label-trees/{$id}");

        // non-admins are not allowed to update
        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$id}");
        $response->assertStatus(403);

        // make sure the tree has a label that is used somewhere
        $a = ImageAnnotationLabelTest::create(['label_id' => $this->labelRoot()->id]);

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
        $tree->addMember($this->admin(), Role::admin());

        $this->beAdmin();
        $this->get('/');
        $response = $this->delete("/api/v1/label-trees/{$id}");
        $this->assertNull($tree->fresh());
        $response->assertRedirect('/');
        $response->assertSessionHas('deleted', true);

        $tree = LabelTreeTest::create();
        $id = $tree->id;
        $tree->addMember($this->admin(), Role::admin());

        $response = $this->delete("/api/v1/label-trees/{$id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertNull($tree->fresh());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('deleted', true);
    }

    public function testDestroyVersion()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::admin());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->beAdmin();
        $this->deleteJson("/api/v1/label-trees/{$tree->id}")
            ->assertStatus(403);
    }

    public function testDestroyVersions()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::admin());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->beAdmin();
        $this->deleteJson("/api/v1/label-trees/{$version->labelTree->id}")
            ->assertStatus(200);
        $this->assertNull($tree->fresh());
    }
}
