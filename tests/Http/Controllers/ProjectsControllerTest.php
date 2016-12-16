<?php

namespace Dias\Tests\Modules\Projects\Http\Controllers;

use Cache;
use TestCase;
use Dias\Role;
use Dias\Tests\UserTest;
use Dias\Tests\ProjectTest;

class ProjectsControllerTest extends TestCase
{
   public function testEdit()
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
        $project = ProjectTest::create(['name' => 'random name']);
        $project2 = ProjectTest::create(['name' => 'another project']);
        $project3 = ProjectTest::create(['name' => 'and again']);
        $project->addUserId($user->id, Role::$guest->id);
        $project2->addUserId($user->id, Role::$admin->id);

        $this->visit("projects")->seePageIs('login');

        $this->be($user);
        $this->get("projects")->assertResponseOk();
        $this->see('random name');
        $this->see('another project');
        $this->dontSee('and again');

        $this->call('GET', 'projects', ['query' => 'name']);
        $this->assertResponseOk();
        $this->see('random name');
        $this->dontSee('another project');
        $this->dontSee('and again');
    }
}
