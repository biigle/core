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
      $response = $this->get('projects/1');
        $response->assertStatus(302);

      // doesn't belong to project
      $this->be($user);
        $response = $this->get('projects/1');
        $response->assertStatus(403);

      // can't admin the project
      $project->addUserId($user->id, Role::$editor->id);
        Cache::flush();
        $response = $this->get('projects/1');
        $response->assertStatus(200);

      // diesn't exist
      $response = $this->get('projects/-1');
        $response->assertStatus(404);
    }

    public function testCreate()
    {
        $user = UserTest::create();

      // not logged in
      $response = $this->get('projects/create');
        $response->assertStatus(302);

        $this->be($user);
        $r = $response = $this->get('projects/create');
        $response->assertStatus(200);
    }

    public function testIndex()
    {
        $user = UserTest::create();
        $this->get('projects')->assertRedirect('login');
        $this->be($user);
        $this->get('projects')->assertRedirect('search?t=projects');
    }
}
