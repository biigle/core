<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

use Biigle\MediaType;
use Biigle\Role;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Cache;
use TestCase;

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
        $project->addUserId($user->id, Role::EDITOR->value);
        $volume = VolumeTest::create(['name' => 'test']);
        $project->addVolumeId($volume->id);
        Cache::flush();
        $response = $this->get("projects/{$id}");
        $response->assertStatus(200);
        // We changed media_type to enum, make sure it's still an array here
        $volumes = json_decode($response->viewData('volumes')->toJson(), true);
        $this->assertSame(
            $volumes[0]['media_type'],
            [
                'id' => MediaType::IMAGE->value,
                'name' => MediaType::IMAGE->label(),
            ]
        );

        // doesn't exist
        $response = $this->get('projects/-1');
        $response->assertStatus(404);
    }

    public function testCreate()
    {
        $user = UserTest::create(['role' => Role::GUEST->value]);

        // not logged in
        $response = $this->get('projects/create');
        $response->assertStatus(302);

        $this->be($user);
        $r = $response = $this->get('projects/create');
        // Guest is not authorized.
        $response->assertStatus(403);

        $user->role = Role::EDITOR;
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
