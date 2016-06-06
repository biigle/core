<?php

use Dias\Role;
use Dias\LabelTree;
use Dias\Visibility;
use Dias\Project;

class ApiProjectLabelTreeControllerTest extends ApiTestCase
{

    public function testIndex()
    {
        $p = $this->project();
        $t = $this->labelTree();
        $label = $this->labelRoot();
        $p->labelTrees()->attach($t->id);

        $this->doTestApiRoute('GET', "/api/v1/projects/{$p->id}/label-trees");

        $this->beUser();
        $this->get("/api/v1/projects/{$p->id}/label-trees");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/projects/{$p->id}/label-trees");
        $this->assertResponseOk();
        $this->seeJson([
            'id' => $t->id,
            'name' => $t->name,
            'description' => $t->description,
        ]);
        $this->seeJson([
            'id' => $label->id,
            'name' => $label->name,
            'color' => $label->color,
            'parent_id' => $label->parent_id,
        ]);
    }

    public function testAvailable()
    {
        $p = $this->project();
        $private = LabelTreeTest::create(['visibility_id' => Visibility::$private->id]);
        $authorized = LabelTreeTest::create(['visibility_id' => Visibility::$private->id]);
        $authorized->authorizedProjects()->attach($p->id);
        $public = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);

        $this->doTestApiRoute('GET', "/api/v1/projects/{$p->id}/label-trees/available");

        $this->beUser();
        $this->get("/api/v1/projects/{$p->id}/label-trees/available");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/projects/{$p->id}/label-trees/available");
        $this->assertResponseOk();
        $this->seeJson([
            'id' => $authorized->id,
            'name' => $authorized->name,
            'description' => $authorized->description,
        ]);
        $this->seeJson([
            'id' => $public->id,
            'name' => $public->name,
            'description' => $public->description,
        ]);
        $this->dontSeeJson([
            'id' => $private->id,
            'name' => $private->name,
            'description' => $private->description,
        ]);
    }

    public function testStore()
    {
        $p = $this->project();
        $private = LabelTreeTest::create(['visibility_id' => Visibility::$private->id]);
        $authorized = LabelTreeTest::create(['visibility_id' => Visibility::$private->id]);
        $authorized->authorizedProjects()->attach($p->id);
        $public = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);

        $this->doTestApiRoute('POST', "/api/v1/projects/{$p->id}/label-trees");

        $this->beGuest();
        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees");
        // label tree id required
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => 999,
        ]);
        // label tree id does not exist
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $private->id,
        ]);
        // project is not authorized
        $this->assertResponseStatus(403);

        $count = $p->labelTrees()->count();
        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $authorized->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals($count + 1, $p->labelTrees()->count());

        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals($count + 2, $p->labelTrees()->count());

        // if the tree is already attached, ignore and respond with success
        $this->json('POST', "/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals($count + 2, $p->labelTrees()->count());
    }

    public function testStoreFormRequest()
    {
        $p = $this->project();
        $public = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);

        $this->beAdmin();
        $this->visit('/');
        $this->post("/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
        ]);
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);

        $this->post("/api/v1/projects/{$p->id}/label-trees", [
            'id' => $public->id,
            '_redirect' => 'settings',
        ]);
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('saved', true);
    }

    public function testDestroy()
    {
        $p = $this->project();
        $t = LabelTreeTest::create();
        $t->projects()->attach($p);

        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");

        $this->beUser();
        $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/999");
        // trying to detach anything that is not attached is ok
        $this->assertResponseOk();

        $this->assertTrue($p->labelTrees()->where('id', $t->id)->exists());
        $this->json('DELETE', "/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $this->assertResponseOk();
        $this->assertFalse($p->labelTrees()->where('id', $t->id)->exists());
    }

    public function testDestroyFormRequest()
    {
        $p = $this->project();
        $t = LabelTreeTest::create();
        $t->projects()->attach($p);

        $this->beAdmin();
        $this->visit('/');
        $this->delete("/api/v1/projects/{$p->id}/label-trees/{$t->id}");
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('deleted', true);

        $this->delete("/api/v1/projects/{$p->id}/label-trees/{$t->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertRedirectedTo('/settings');
        // should be false because nothing was deleted
        $this->assertSessionHas('deleted', false);
    }
}
