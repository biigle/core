<?php

use Dias\Role;

class AnnotationsModuleHttpControllersAnnotationControllerTest extends TestCase {

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
      $this->assertResponseStatus(401);

      $this->be($project->creator);
      $this->get('annotate/'.$image->id);
      $this->assertResponseOk();
      $this->assertViewHas('user');
      $this->assertViewHas('image');

      // doesn't exist
      $this->get('annotate/-1');
      $this->assertResponseStatus(404);
   }
}
