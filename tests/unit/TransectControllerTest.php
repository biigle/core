<?php

use Dias\Role;

class TransectControllerTest extends TestCase {

   public function testIndex() {
      $project = ProjectTest::create();
      $transect = TransectTest::create();
      $project->addTransectId($transect->id);
      $user = UserTest::create();

      // not logged in
      $this->get('transects/'.$transect->id);
      $this->assertResponseStatus(302);

      // doesn't belong to project
      $this->be($user);
      $this->get('transects/'.$transect->id);
      $this->assertResponseStatus(401);

      $this->be($project->creator);
      $this->get('transects/'.$transect->id);
      $this->assertResponseOk();

      // doesn't exist
      $this->get('projects/-1');
      $this->assertResponseStatus(404);
   }

   public function testCreate() {
      $project = ProjectTest::create();
      $user = UserTest::create();

      // not logged in
      $this->get('transects/create');
      $this->assertResponseStatus(302);

      $this->be($user);
      // user is not allowed to edit the project
      $this->get('transects/create?project='.$project->id);
      $this->assertResponseStatus(401);

      $this->be($project->creator);
      // project doesn't exist
      $this->get('transects/create?project=-1');
      $this->assertResponseStatus(404);

      $this->get('transects/create?project='.$project->id);
      $this->assertResponseOk();
   }
}
