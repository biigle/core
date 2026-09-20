<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

use Biigle\MediaType;
use Biigle\Role;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Cache;
use TestCase;

class ProjectStatisticsControllerTest extends TestCase
{
    public function testShow()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create(['name' => 'test']);
        $project->addVolumeId($volume->id);
        $id = $project->id;
        $user = UserTest::create();

        $this->get("projects/{$id}/charts")->assertStatus(302);

        $this->be($user);
        $this->get("projects/{$id}/charts")->assertStatus(403);

        $project->addUserId($user->id, Role::EDITOR->value);
        Cache::flush();
        $response = $this->get("projects/{$id}/charts");
        $response->assertStatus(200);
        $volumes = json_decode($response->viewData('volumes')->toJson(), true);
        $this->assertSame(
            $volumes[0]['media_type'],
            [
                'id' => MediaType::IMAGE->value,
                'name' => MediaType::IMAGE->label(),
            ]
        );

        // doesn't exist
        $this->get('projects/-1/charts')->assertStatus(404);
    }
}
