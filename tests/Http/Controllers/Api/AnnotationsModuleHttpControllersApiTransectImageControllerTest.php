<?php

class AnnotationsModuleHttpControllersApiTransectImageControllerTest extends ApiTestCase {

    public function testIndexHavingAnnotations() {
        $transect = TransectTest::create();
        $id = $transect->id;
        $this->project->addTransectId($id);

        // call fresh() so the IDs and numbers get strings if SQLite is used for testing
        // so the assertions below work
        $image = ImageTest::create(['transect_id' => $id])->fresh();
        $annotation = AnnotationTest::create(['image_id' => $image->id])->fresh();
        $image2 = ImageTest::create(['transect_id' => $id, 'filename' => 'b.jpg'])->fresh();

        $this->doTestApiRoute('GET', '/api/v1/transects/'.$id.'/images/having-annotations');

        // api key authentication
        $this->callToken('GET', '/api/v1/transects/'.$id.'/images/having-annotations', $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('GET', '/api/v1/transects/'.$id.'/images/having-annotations', $this->guest);
        $this->assertResponseOk();

        $this->be($this->guest);
        $this->get('/api/v1/transects/'.$id.'/images/having-annotations')
            ->seeJsonEquals([$image->id]);
    }
}
