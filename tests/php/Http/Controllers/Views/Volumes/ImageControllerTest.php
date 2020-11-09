<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use TestCase;

class ImageControllerTest extends TestCase
{
    public function testIndex()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $image = ImageTest::create();
        $project->addVolumeId($image->volume->id);

        // not logged in
        $response = $this->get('images/'.$image->id);
        $response->assertStatus(302);

        // doesn't belong to project
        $this->be($user);
        $response = $this->get('images/'.$image->id);
        $response->assertStatus(403);

        $this->be($project->creator);
        $response = $this->get('images/'.$image->id);
        $response->assertStatus(200);

        // doesn't exist
        $response = $this->get('images/-1');
        $response->assertStatus(404);
    }
}
