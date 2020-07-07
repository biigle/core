<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

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
        $id = $project->id;
        $user = UserTest::create();

        // not logged in
        $response = $this->get("projects/{$id}");
        $response->assertStatus(302);

        // doesn't belong to project
        $this->be($user);
        $response = $this->get("projects/{$id}");
        $response->assertStatus(403);

        // can't admin the project
        $project->addUserId($user->id, Role::editorId());
        Cache::flush();
        $response = $this->get("projects/{$id}");
        $response->assertStatus(200);

        // diesn't exist
        $response = $this->get('projects/-1');
        $response->assertStatus(404);
    }

    public function testCreate()
    {
        $user = UserTest::create(['role_id' => Role::guestId()]);

        // not logged in
        $response = $this->get('projects/create');
        $response->assertStatus(302);

        $this->be($user);
        $r = $response = $this->get('projects/create');
        // Guest is not authorized.
        $response->assertStatus(403);

        $user->role_id = Role::editorId();
        $user->save();

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
