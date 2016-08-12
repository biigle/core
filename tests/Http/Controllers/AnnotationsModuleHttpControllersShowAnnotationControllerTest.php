<?php

class AnnotationsModuleHttpControllersShowAnnotationControllerTest extends ApiTestCase {

    public function testShow() {
        $annotation = AnnotationTest::create();
        $this->project()->addTransectId($annotation->image->transect_id);

        $this->beUser();
        $this->json('GET', 'annotations/show/'.$annotation->id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('annotations/show/'.$annotation->id);
        $this->assertRedirectedTo('annotate/'.$annotation->image_id.'?annotation='.$annotation->id);

    }
}
