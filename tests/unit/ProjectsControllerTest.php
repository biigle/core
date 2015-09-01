<?php

use Dias\Role;

class ProjectsControllerTest extends TestCase {

   public function testEdit() {
      $project = ProjectTest::create();
      $user = UserTest::create();

      // not logged in
      $this->get('projects/1');
      $this->assertResponseStatus(302);

      // doesn't belong to project
      $this->be($user);
      $this->get('projects/1');
      $this->assertResponseStatus(401);

      // can't admin the project
      $project->addUserId($user->id, Role::$editor->id);
      Cache::flush();
      $this->get('projects/1');
      $this->assertResponseOk();

      // diesn't exist
      $this->get('projects/-1');
      $this->assertResponseStatus(404);
   }

   public function testCreate() {
      $user = UserTest::create();

      // not logged in
      $this->get('projects/create');
      $this->assertResponseStatus(302);

      $this->be($user);
      $r = $this->get('projects/create');
      $this->assertResponseOk();
   }
}
