<?php

namespace Biigle\Tests\Modules\Projects\Http\Controllers;

use Cache;
use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;

class ProjectsControllerTest extends TestCase
{
    public function testShow()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();

      // not logged in
      $this->get('projects/1');
        $this->assertResponseStatus(302);

      // doesn't belong to project
      $this->be($user);
        $this->get('projects/1');
        $this->assertResponseStatus(403);

      // can't admin the project
      $project->addUserId($user->id, Role::$editor->id);
        Cache::flush();
        $this->get('projects/1');
        $this->assertResponseOk();

      // diesn't exist
      $this->get('projects/-1');
        $this->assertResponseStatus(404);
    }

    public function testCreate()
    {
        $user = UserTest::create();

      // not logged in
      $this->get('projects/create');
        $this->assertResponseStatus(302);

        $this->be($user);
        $r = $this->get('projects/create');
        $this->assertResponseOk();
    }

    public function testIndex()
    {
        $user = UserTest::create();
        $this->visit('projects')->seePageIs('login');
        $this->be($user);
        $this->visit('projects')->seePageIs('search?t=projects');
    }
}
