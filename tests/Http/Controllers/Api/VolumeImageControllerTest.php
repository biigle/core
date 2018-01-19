<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

class VolumeImageControllerTest extends ApiTestCase
{
    public function testIndexOrderByFilename()
    {
        $id = $this->volume()->id;

        $image1 = ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);
        $image2 = ImageTest::create(['volume_id' => $id, 'filename' => 'a.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/order-by/filename");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images/order-by/filename");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/images/order-by/filename")
            ->assertStatus(200);
        // ordering is crucial, so we can't simply use seeJsonEquals!
        $this->assertEquals("[{$image2->id},{$image1->id}]", $response->getContent());
    }

    public function testHasAnnotation()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        ImageLabelTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/filter/labels");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/images/filter/labels")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }

    public function testHasImageLabelUser()
    {
        $vid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $vid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $vid, 'filename' => 'b.jpg']);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/images/filter/image-label-user/{$uid}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$vid}/images/filter/image-label-user/{$uid}");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$vid}/images/filter/image-label-user/{$uid}")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }

    public function testHasImageLabel()
    {
        $vid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $vid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);

        $lid = $label->label_id;

        // This image shouldn't appear because it has the wrong label.
        $image2 = ImageTest::create(['volume_id' => $vid, 'filename' => 'b.jpg']);
        $label2 = ImageLabelTest::create([
            'image_id' => $image2->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/images/filter/image-label/{$lid}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$vid}/images/filter/image-label/{$lid}");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$vid}/images/filter/image-label/{$lid}")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }
}
