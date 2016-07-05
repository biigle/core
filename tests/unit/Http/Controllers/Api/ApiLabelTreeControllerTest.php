<?php

use Dias\Role;
use Dias\LabelTree;
use Dias\Visibility;

class ApiLabelTreeControllerTest extends ApiTestCase
{

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/label-trees');

        $this->beUser();
        $tree = $this->labelTree();
        $this->get('/api/v1/label-trees')->seeJson([
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'created_at' => (string) $tree->created_at,
            'updated_at' => (string) $tree->updated_at,
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
        $this->put('/api/v1/label-trees/1');
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->put('/api/v1/label-trees/999');
        $this->assertResponseStatus(404);

        $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'name' => '',
        ]);
        // name must not be empty if it is present
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'description' => '',
        ]);
        // description must not be empty if it is present
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'visibility_id' => 999,
        ]);
        // visibility must exist
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'name' => 'my test',
        ]);
        $this->assertResponseOk();

        $this->assertEquals('my test', $tree->fresh()->name);

        $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'description' => 'this is my test',
        ]);
        $this->assertResponseOk();

        $this->assertEquals('this is my test', $tree->fresh()->description);

        $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'visibility_id' => Visibility::$public->id,
        ]);
        $this->assertResponseOk();

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
        $this->visit('/');
        $this->put("/api/v1/label-trees/{$id}", [
            'name' => 'abc',
        ]);
        $this->assertEquals('abc', $tree->fresh()->name);
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);

        $this->put("/api/v1/label-trees/{$id}", [
            'description' => 'abc',
            '_redirect' => 'settings',
        ]);
        $this->assertEquals('abc', $tree->fresh()->description);
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('saved', true);
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
        $this->json('PUT', "/api/v1/label-trees/{$id}", [
            'visibility_id' => Visibility::$private->id,
        ]);

        // the IDs may be strings when testing with sqlite
        $this->assertEquals([$authorized->id], array_map('intval', $tree->projects()->pluck('id')->all()));
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/label-trees');

        $this->beUser();
        $this->json('POST', '/api/v1/label-trees');
        // creating an empty project is an error
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
        ]);
        // visibility is required
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/label-trees', [
            'visibility_id' => Visibility::$public->id,
        ]);
        // name is required
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => 9999,
        ]);
        // visibility must exist
        $this->assertResponseStatus(422);

        $this->assertEquals(0, LabelTree::count());

        $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
        ]);
        // description is optional
        $this->assertResponseOk();

        $this->assertEquals(1, LabelTree::count());

        $this->json('POST', '/api/v1/label-trees', [
            'name' => 'abc',
            // make ID a string so seeJsonEquals works
            'visibility_id' => ''.Visibility::$public->id,
            'description' => 'my description',
        ]);
        $this->assertResponseOk();

        $this->assertEquals(2, LabelTree::count());

        $tree = LabelTree::orderBy('id', 'desc')->first();
        if ($this->isSqlite()) {
            $tree->visibility_id = (int) $tree->visibility_id;
        }
        $this->seeJsonEquals($tree->toArray());

        // creator gets first label tree admin
        $member = $tree->members()->find($this->user()->id);
        $this->assertNotNull($member);
        $this->assertEquals(Role::$admin->id, $member->role_id);
    }

    public function testStoreFormRequest()
    {
        $this->beUser();
        $this->visit('/');
        $this->post('/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
            'description' => 'my description',
        ]);
        $this->assertEquals(1, LabelTree::count());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('newTree');

        $this->post('/api/v1/label-trees', [
            'name' => 'abc',
            'visibility_id' => Visibility::$public->id,
            'description' => 'my description',
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(2, LabelTree::count());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('newTree');
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
        $this->json('DELETE', "/api/v1/label-trees/{$id}");
        $this->assertResponseStatus(403);

        // make sure the tree has a label that is used somewhere
        $a = AnnotationLabelTest::create(['label_id' => $this->labelRoot()->id]);

        $this->beAdmin();
        $this->json('DELETE', "/api/v1/label-trees/{$id}");
        // can't be deleted if a label is still in use
        $this->assertResponseStatus(403);

        $a->delete();

        $this->assertNotNull($tree->fresh());
        $this->json('DELETE', "/api/v1/label-trees/{$id}");
        $this->assertResponseOk();
        $this->assertNull($tree->fresh());
    }

    public function testDestroyFormRequest()
    {
        $tree = LabelTreeTest::create();
        $id = $tree->id;
        $tree->addMember($this->admin(), Role::$admin);

        $this->beAdmin();
        $this->visit('/');
        $this->delete("/api/v1/label-trees/{$id}");
        $this->assertNull($tree->fresh());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('deleted', true);

        $tree = LabelTreeTest::create();
        $id = $tree->id;
        $tree->addMember($this->admin(), Role::$admin);

        $this->delete("/api/v1/label-trees/{$id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertNull($tree->fresh());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('deleted', true);
    }
}
