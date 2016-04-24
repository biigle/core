<?php

class AnnotationsModuleHttpControllersApiTransectImageControllerTest extends ApiTestCase {

    public function testIndexHavingAnnotations() {
        $transect = TransectTest::create();
        $id = $transect->id;
        $this->project()->addTransectId($id);

        $image = ImageTest::create(['transect_id' => $id]);
        AnnotationTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['transect_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/images/having-annotations");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/images/having-annotations");
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/images/having-annotations");
        $this->assertResponseOk();

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect = ["{$image->id}"];
        } else {
            $expect = [$image->id];
        }

        $this->get("/api/v1/transects/{$id}/images/having-annotations")
            ->seeJsonEquals($expect);
    }
}
