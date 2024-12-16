<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use Biigle\Tests\VideoTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use TestCase;

class VideoInfoControllerTest extends TestCase
{
    public function testIndex()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $video = VideoTest::create();
        $project->addVolumeId($video->volume->id);

        // not logged in
        $response = $this->get('videos/'.$video->id);
        $response->assertStatus(302);

        // doesn't belong to project
        $this->be($user);
        $response = $this->get('videos/'.$video->id);
        $response->assertStatus(403);

        $this->be($project->creator);
        $response = $this->get('videos/'.$video->id);
        $response->assertStatus(200);

        // doesn't exist
        $response = $this->get('videos/-1');
        $response->assertStatus(404);
    }
}
