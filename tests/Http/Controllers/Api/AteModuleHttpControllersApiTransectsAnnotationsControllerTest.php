<?php


class AteModuleHttpControllersApiTransectsAnnotationsControllerTest extends ApiTestCase {

    public function testFilter() {
        $id = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $a3 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = AnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = AnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other transect should not appear
        AnnotationLabelTest::create(['annotation_id' => $a3->id]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/annotations/filter/label/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseStatus(403);

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect1 = ["{$a1->id}", "{$a2->id}"];
            $expect2 = ["{$a3->id}"];
        } else {
            $expect1 = [$a1->id, $a2->id];
            $expect2 = [$a3->id];
        }

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect1);

        $this->get("/api/v1/transects/{$id}/annotations/filter/label/{$l3->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect2);
    }
}
