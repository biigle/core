<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

class ImageLabelControllerTest extends ApiTestCase
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
        $il = ImageLabelTest::create(['image_id' => $this->image->id]);

        $this->doTestApiRoute('GET', "/api/v1/images/{$id}/labels");

        $this->beUser();
        $this->get("/api/v1/images/{$id}/labels");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/images/{$id}/labels");
        $this->assertResponseOk();
        $this->seeJson([
            'id' => $il->label->id,
            'name' => $il->label->name,
            'parent_id' => $il->label->parent_id,
            'color' => $il->label->color,
        ]);

        $this->seeJson([
            'id' => $il->user->id,
            'firstname' => $il->user->firstname,
            'lastname' => $il->user->lastname,
        ]);
    }

    public function testStore()
    {
        $id = $this->image->id;
        $this->doTestApiRoute('POST', "/api/v1/images/{$id}/labels");

        // missing arguments
        $this->beEditor();
        $this->json('POST', "/api/v1/images/{$id}/labels");
        $this->assertResponseStatus(422);

        $this->assertEquals(0, $this->image->labels()->count());

        $this->beUser();
        $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(1, $this->image->labels()->count());

        $this->beAdmin();
        // the same label cannot be attached twice
        $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $this->assertResponseStatus(400);
        $this->assertEquals(1, $this->image->labels()->count());

        $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelChild()->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(2, $this->image->labels()->count());
        $this->seeJson([
            'id' => $this->labelChild()->id,
            'name' => $this->labelChild()->name,
            'color' => $this->labelChild()->color,
        ]);
        $this->seeJson([
            'id' => $this->admin()->id,
            'firstname' => $this->admin()->firstname,
            'lastname' => $this->admin()->lastname,
            'role_id' => $this->admin()->role_id,
        ]);
    }

    public function testDestroy()
    {
        $id = ImageLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = ImageLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->admin()->id,
        ])->id;

        $this->doTestApiRoute('DELETE', '/api/v1/image-labels/'.$id);

        $this->beUser();
        $this->delete('/api/v1/image-labels/'.$id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->delete('/api/v1/image-labels/'.$id);
        $this->assertResponseStatus(403);

        $this->assertTrue($this->image->labels()->where('id', $id)->exists());
        $this->beEditor();
        $this->delete('/api/v1/image-labels/'.$id);
        $this->assertResponseOk();
        $this->assertFalse($this->image->labels()->where('id', $id)->exists());

        $this->delete('/api/v1/image-labels/'.$id2);
        // not the own label
        $this->assertResponseStatus(403);

        $this->assertTrue($this->image->labels()->where('id', $id2)->exists());

        $id = ImageLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->editor()->id,
        ])->id;
        $this->assertTrue($this->image->labels()->where('id', $id)->exists());

        $this->beAdmin();
        $this->delete('/api/v1/image-labels/'.$id);
        $this->assertResponseOk();
        $this->assertFalse($this->image->labels()->where('id', $id)->exists());

        $this->delete('/api/v1/image-labels/'.$id2);
        $this->assertResponseOk();
        $this->assertFalse($this->image->labels()->exists());
    }
}
