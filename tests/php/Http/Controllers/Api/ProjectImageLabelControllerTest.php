<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\ImageLabelTest;

class ProjectImageLabelControllerTest extends ApiTestCase
{
    private $image;

    public function setUp()
    {
        parent::setUp();
        $this->image = ImageTest::create(['volume_id' => $this->volume()->id]);
    }

    public function testIndex()
    {
        $id = $this->image->id;
        $pid = $this->project()->id;

        $il = ImageLabelTest::create([
            'image_id' => $this->image->id,
            'project_volume_id' => $this->projectVolume()->id,
        ]);
        $il2 = ImageLabelTest::create([
            'image_id' => $this->image->id
        ]);

        $this->doTestApiRoute('GET', "/api/v1/projects/{$pid}/images/{$id}/labels");

        $this->beUser();
        $response = $this->get("/api/v1/projects/{$pid}/images/{$id}/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/projects/{$pid}/images/{$id}/labels");
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $il->label->id,
            'name' => $il->label->name,
            'parent_id' => $il->label->parent_id,
            'color' => $il->label->color,
        ]);

        $response->assertJsonFragment([
            'id' => $il->user->id,
            'firstname' => $il->user->firstname,
            'lastname' => $il->user->lastname,
        ]);

        $response->assertJsonMissing([
            'name' => $il2->label->name,
        ]);
    }

    public function testIndexAccessThroughProject()
    {
        $pid = $this->project()->id;
        $iid = $this->image->id;

        $otherProject = ProjectTest::create();
        $otherProject->volumes()->attach($this->image->volume_id);

        $this->be($otherProject->creator);
        $this->get("/api/v1/projects/{$pid}/images/{$iid}/labels")
            ->assertStatus(403);

        $this->get("/api/v1/projects/{$otherProject->id}/images/{$iid}/labels")
            ->assertStatus(200);
    }

    public function testStore()
    {
        $id = $this->image->id;
        $pid = $this->project()->id;

        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/images/{$id}/labels");

        $this->beGuest();
        $response = $this->post("/api/v1/projects/{$pid}/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/projects/9999/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        // project does not exist
        $response->assertStatus(404);

        $this->assertEquals(0, $this->image->labels()->count());

        $response = $this->post("/api/v1/projects/{$pid}/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $response->assertStatus(200);
        $this->assertEquals(1, $this->image->labels()->count());

        $this->beAdmin();
        // the same label cannot be attached twice
        $response = $this->post("/api/v1/projects/{$pid}/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $response->assertStatus(400);
        $this->assertEquals(1, $this->image->labels()->count());

        $response = $this->json('POST', "/api/v1/projects/{$pid}/images/{$id}/labels", [
            'label_id' => $this->labelChild()->id,
        ]);
        $response->assertStatus(200);
        $this->assertEquals(2, $this->image->labels()->count());
        $response->assertJsonFragment([
            'id' => $this->labelChild()->id,
            'name' => $this->labelChild()->name,
            'color' => $this->labelChild()->color,
        ]);
        $response->assertJsonFragment([
            'id' => $this->admin()->id,
            'firstname' => $this->admin()->firstname,
            'lastname' => $this->admin()->lastname,
            'role_id' => $this->admin()->role_id,
        ]);
    }
}
