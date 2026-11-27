<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

use Biigle\Enums\MediaType;
use Biigle\Enums\Role;
use Biigle\Tests\ImageTest;
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
        $project->addUserId($user->id, Role::EDITOR);
        $volume = VolumeTest::create(['name' => 'test']);
        $project->addVolumeId($volume->id);
        Cache::flush();
        $response = $this->get("projects/{$id}");
        $response->assertStatus(200);

        $volumes = json_decode($response->viewData('volumes')->toJson(), true);
        $this->assertSame($volumes[0]['media_type'], MediaType::IMAGE->value);
        $this->assertSame($volumes[0]['media_type_label'], MediaType::IMAGE->label());

        // doesn't exist
        $response = $this->get('projects/-1');
        $response->assertStatus(404);
    }

    public function testShowThumbnails()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->addVolumeId($volume->id);
        $image = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $emptyVolume = VolumeTest::create();
        $project->addVolumeId($emptyVolume->id);
        $user = UserTest::create();
        $project->addUserId($user->id, Role::GUEST);
        Cache::flush();

        $this->be($user);
        // Load the page twice to test cache misses and hits.
        foreach ([1, 2] as $run) {
            $response = $this->get("projects/{$project->id}");
            $response->assertStatus(200);
            $volumes = collect(json_decode($response->viewData('volumes')->toJson(), true))
                ->keyBy('id');

            $this->assertStringContainsString($image->uuid, $volumes[$volume->id]['thumbnailUrl']);
            $this->assertCount(1, $volumes[$volume->id]['thumbnailsUrl']);
            $this->assertStringContainsString($image->uuid, $volumes[$volume->id]['thumbnailsUrl'][0]);
            $this->assertNull($volumes[$emptyVolume->id]['thumbnailUrl']);
            $this->assertSame([], $volumes[$emptyVolume->id]['thumbnailsUrl']);
        }
    }

    public function testCreate()
    {
        $user = UserTest::create(['role' => Role::GUEST]);

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
