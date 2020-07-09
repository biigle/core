<?php

namespace Biigle\Tests\Http\Controllers\Views\Annotations;

use ApiTestCase;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;

class AnnotationToolControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);
        $project->addVolumeId($volume->id);
        // not logged in
        $response = $this->get('annotate/'.$image->id);
        $response->assertStatus(302);

        // doesn't belong to project
        $this->be(UserTest::create());
        $response = $this->get('annotate/'.$image->id);
        $response->assertStatus(403);

        $this->be($project->creator);
        $response = $this->get('annotate/'.$image->id);
        $response->assertStatus(200);
        $response->assertViewHas('user');
        $response->assertViewHas('image');

        // doesn't exist
        $response = $this->get('annotate/-1');
        $response->assertStatus(404);
    }
}
