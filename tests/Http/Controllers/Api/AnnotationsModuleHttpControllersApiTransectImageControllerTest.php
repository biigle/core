<?php

class AnnotationsModuleHttpControllersApiTransectImageControllerTest extends ApiTestCase {

    public function testHasAnnotation() {
        $id = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $id]);
        AnnotationTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['transect_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/images/filter/annotations");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/images/filter/annotations");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/images/filter/annotations");
        $this->assertResponseOk();

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/transects/{$id}/images/filter/annotations")
            ->seeJsonEquals($expect);
    }

    public function testHasAnnotationUser() {
        $tid = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['transect_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = AnnotationTest::create(['image_id' => $image2->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/images/filter/annotation-user/{$uid}");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-user/{$uid}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-user/{$uid}");
        $this->assertResponseOk();

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-user/{$uid}")
            ->seeJsonEquals($expect);
    }

    public function testHasAnnotationLabel() {
        $tid = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $lid = $label->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['transect_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = AnnotationTest::create(['image_id' => $image2->id]);
        $label2 = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/images/filter/annotation-label/{$lid}");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-label/{$lid}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-label/{$lid}");
        $this->assertResponseOk();

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-label/{$lid}")
            ->seeJsonEquals($expect);
    }
}
