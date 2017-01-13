<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use Biigle\Role;
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
        $this->get("/api/v1/volumes/{$id}/images/order-by/filename");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/images/order-by/filename")
            ->assertResponseOk();
        // ordering is crucial, so we can't simply use seeJsonEquals!
        $this->assertEquals("[{$image2->id},{$image1->id}]", $this->response->getContent());
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
        $this->get("/api/v1/volumes/{$id}/images/filter/labels");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/images/filter/labels");
        $this->assertResponseOk();

        $this->get("/api/v1/volumes/{$id}/images/filter/labels")
            ->seeJsonEquals([$image->id]);
    }

    public function testHasImageLabelUser()
    {
        $tid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $tid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $tid, 'filename' => 'b.jpg']);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/images/filter/image-label-user/{$uid}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$tid}/images/filter/image-label-user/{$uid}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$tid}/images/filter/image-label-user/{$uid}");
        $this->assertResponseOk();

        if ($this->isSqlite())
        {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/volumes/{$tid}/images/filter/image-label-user/{$uid}")
            ->seeJsonEquals($expect);
    }

    public function testHasImageLabel()
    {
        $tid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $tid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);

        $lid = $label->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $tid, 'filename' => 'b.jpg']);
        $label2 = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/images/filter/image-label/{$lid}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$tid}/images/filter/image-label/{$lid}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$tid}/images/filter/image-label/{$lid}");
        $this->assertResponseOk();

        if ($this->isSqlite())
        {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/volumes/{$tid}/images/filter/image-label/{$lid}")
            ->seeJsonEquals($expect);
    }
}
