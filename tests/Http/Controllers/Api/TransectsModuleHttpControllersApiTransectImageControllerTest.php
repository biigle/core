<?php

use Dias\Role;

class TransectsModuleHttpControllersApiTransectImageControllerTest extends ApiTestCase {

    public function testIndexOrderByFilename() {
        $id = $this->transect()->id;

        $image1 = ImageTest::create(['transect_id' => $id, 'filename' => 'b.jpg']);
        $image2 = ImageTest::create(['transect_id' => $id, 'filename' => 'a.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/images/order-by/filename");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/images/order-by/filename");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/images/order-by/filename")
            ->assertResponseOk();
        // ordering is crucial, so we can't simply use seeJsonEquals!
        $this->assertEquals("[{$image2->id},{$image1->id}]", $this->response->getContent());
    }

    public function testHasAnnotation() {
        $id = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $id]);
        ImageLabelTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['transect_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/images/filter/labels");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/images/filter/labels");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/images/filter/labels");
        $this->assertResponseOk();

        $this->get("/api/v1/transects/{$id}/images/filter/labels")
            ->seeJsonEquals([$image->id]);
    }

    public function testHasImageLabelUser() {
        $tid = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $tid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['transect_id' => $tid, 'filename' => 'b.jpg']);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/images/filter/image-label-user/{$uid}");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/images/filter/image-label-user/{$uid}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/images/filter/image-label-user/{$uid}");
        $this->assertResponseOk();

        if ($this->isSqlite()) {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/transects/{$tid}/images/filter/image-label-user/{$uid}")
            ->seeJsonEquals($expect);
    }

    public function testHasImageLabel() {
        $tid = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $tid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);

        $lid = $label->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['transect_id' => $tid, 'filename' => 'b.jpg']);
        $label2 = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/images/filter/image-label/{$lid}");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/images/filter/image-label/{$lid}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/images/filter/image-label/{$lid}");
        $this->assertResponseOk();

        if ($this->isSqlite()) {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/transects/{$tid}/images/filter/image-label/{$lid}")
            ->seeJsonEquals($expect);
    }
}
