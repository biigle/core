<?php

class AnnotationsModuleHttpControllersApiTransectUserControllerTest extends ApiTestCase {

    public function testIndex() {
        $tid = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/users");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/users");
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/users");
        $this->assertResponseOk();

        // create admin here, should not be returned in output
        $this->admin();
        $this->get("/api/v1/transects/{$tid}/users")
            ->seeJsonEquals([$this->editor()->fresh()->toArray()]);
    }
}
