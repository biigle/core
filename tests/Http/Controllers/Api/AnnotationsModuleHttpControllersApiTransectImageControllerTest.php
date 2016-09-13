<?php

use Carbon\Carbon;

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
        $this->get("/api/v1/transects/{$id}/images/filter/annotations")
            ->seeJsonEquals([$image->id]);
        $this->assertResponseOk();
    }

    public function testHasAnnotationUser() {
        $tid = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        // image ID should be returned only once even with multiple annotations on it
        AnnotationLabelTest::create([
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

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-user/{$uid}")
            ->seeJsonEquals($expect);
        $this->assertResponseOk();
    }

    public function testHasAnnotationUserAnnotationSession()
    {
        $tid = $this->transect()->id;

        AnnotationSessionTest::create([
            'transect_id' => $tid,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $uid = $this->editor()->id;

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-user/{$uid}")
            ->seeJsonEquals($expect);

        $this->beEditor();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-user/{$uid}")
            ->seeJsonEquals([]);
    }

    public function testHasAnnotationLabel() {
        $tid = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = LabelTest::create();
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id,
        ]);
        // image ID should be returned only once, no matter how often the label is present
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id,
        ]);

        $lid = $label->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['transect_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = AnnotationTest::create(['image_id' => $image2->id]);
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/images/filter/annotation-label/{$lid}");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-label/{$lid}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/images/filter/annotation-label/{$lid}")
            ->seeJsonEquals([$image->id]);
        $this->assertResponseOk();
    }
}
