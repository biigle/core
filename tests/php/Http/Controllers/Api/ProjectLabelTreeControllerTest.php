<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Project;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Visibility;

class ProjectLabelTreeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $p = $this->project();
        $t = $this->labelTree();
        $label = $this->labelRoot();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$p->id}/label-trees");

        $this->beUser();
        $response = $this->get("/api/v1/projects/{$p->id}/label-trees");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/projects/{$p->id}/label-trees");
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $t->id,
            'name' => $t->name,
            'description' => $t->description,
        ]);
        $response->assertJsonFragment([
            'id' => $label->id,
            'name' => $label->name,
            'color' => $label->color,
            'parent_id' => $label->parent_id,
        ]);
    }

    public function testAvailable()
    {
        $p = $this->project();
        $private = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $authorized = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $authorized->authorizedProjects()->attach($p->id);
        $public = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);
        $version = LabelTreeVersionTest::create();
        $public->version_id = $version->id;
        $public->save();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$p->id}/label-trees/available");

        $this->beUser();
        $response = $this->get("/api/v1/projects/{$p->id}/label-trees/available");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/projects/{$p->id}/label-trees/available");
        $response->assertStatus(200);
        $response->assertJsonFragment([[
            'id' => $authorized->id,
            'name' => $authorized->name,
            'description' => $authorized->description,
            'version' => null,
        ]]);
        $response->assertJsonFragment([[
            'id' => $public->id,
            'name' => $public->name,
            'description' => $public->description,
            'version' => $version->toArray(),
        ]]);
        $response->assertJsonMissing([[
            'id' => $private->id,
            'name' => $private->name,
            'description' => $private->description,
            'version' => null,
        ]]);
    }

    public function testStore()
    {
        $p = $this->project();
        $private = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $authorized = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $authorized->authorizedProjects()->attach($p->id);
        $public = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);

        $this->doTestApiRoute('POST', "/api/v1/projects/{$p->id}/label-trees");

        $this->beGuest();
        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees");
        // label tree id required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => 999,
        ]);
        // label tree id does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $private->id,
        ]);
        // project is not authorized
        $response->assertStatus(422);

        $count = $p->labelTrees()->count();
        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $authorized->id,
        ]);
        $response->assertStatus(200);
        $this->assertEquals($count + 1, $p->labelTrees()->count());

        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
        ]);
        $response->assertStatus(200);
        $this->assertEquals($count + 2, $p->labelTrees()->count());

        // if the tree is already attached, ignore and respond with success
        $response = $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
        ]);
        $response->assertStatus(200);
        $this->assertEquals($count + 2, $p->labelTrees()->count());
    }

    public function testStoreFormRequest()
    {
        $p = $this->project();
        $public = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);

        $this->beAdmin();
        $this->get('/');
        $response = $this->post("/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
        ]);
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);

        $response = $this->post("/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
            '_redirect' => 'settings',
        ]);
        $response->assertRedirect('/settings');
        $response->assertSessionHas('saved', true);
    }

    public function testDestroy()
    {
        $p = $this->project();
        $t = LabelTreeTest::create();
        $t->projects()->attach($p);

        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");

        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/999");
        // trying to detach anything that is not attached is ok
        $response->assertStatus(200);

        $this->assertTrue($p->labelTrees()->where('id', $t->id)->exists());
        $response = $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $response->assertStatus(200);
        $this->assertFalse($p->labelTrees()->where('id', $t->id)->exists());
    }

    public function testDestroyFormRequest()
    {
        $p = $this->project();
        $t = LabelTreeTest::create();
        $t->projects()->attach($p);

        $this->beAdmin();
        $this->get('/');
        $response = $this->delete("/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $response->assertRedirect('/');
        $response->assertSessionHas('deleted', true);

        $response = $this->delete("/api/v1/projects/{$p->id}/label-trees/{$t->id}", [
            '_redirect' => 'settings',
        ]);
        $response->assertRedirect('/settings');
        // should be false because nothing was deleted
        $response->assertSessionHas('deleted', false);
    }
}
