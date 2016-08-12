<?php

use Dias\Role;

class AnnotationsModuleHttpControllersAnnotationControllerTest extends ApiTestCase {

    public function testIndex() {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $image = ImageTest::create(['transect_id' => $transect->id]);
        $project->addTransectId($transect->id);
        // not logged in
        $this->get('annotate/'.$image->id);
        $this->assertResponseStatus(302);

        // doesn't belong to project
        $this->be(UserTest::create());
        $this->get('annotate/'.$image->id);
        $this->assertResponseStatus(403);

        $this->be($project->creator);
        $this->get('annotate/'.$image->id);
        $this->assertResponseOk();
        $this->assertViewHas('user');
        $this->assertViewHas('image');

        // doesn't exist
        $this->get('annotate/-1');
        $this->assertResponseStatus(404);
    }

    public function testShow() {
        $annotation = AnnotationTest::create();
        $this->project()->addTransectId($annotation->image->transect_id);

        $this->beUser();
        $this->json('GET', 'annotations/'.$annotation->id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('annotations/'.$annotation->id);
        $this->assertRedirectedTo('annotate/'.$annotation->image_id.'?annotation='.$annotation->id);
    }
}
