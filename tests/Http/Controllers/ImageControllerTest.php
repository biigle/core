<?php

namespace Biigle\Tests\Modules\Transects\Http\Controllers;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;

class ImageControllerTest extends TestCase
{
   public function testIndex()
   {
      $project = ProjectTest::create();
      $user = UserTest::create();
      $image = ImageTest::create();
      $project->addTransectId($image->transect->id);

      // not logged in
      $this->get('images/'.$image->id);
      $this->assertResponseStatus(302);

      // doesn't belong to project
      $this->be($user);
      $this->get('images/'.$image->id);
      $this->assertResponseStatus(403);

      $this->be($project->creator);
      $this->get('images/'.$image->id);
      $this->assertResponseOk();

      // doesn't exist
      $this->get('images/-1');
      $this->assertResponseStatus(404);
   }
}
