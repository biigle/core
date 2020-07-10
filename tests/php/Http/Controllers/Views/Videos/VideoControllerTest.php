<?php

namespace Biigle\Tests\Http\Controllers\Views\Videos;

use ApiTestCase;
use Biigle\Tests\VideoTest;

class VideoControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $video = VideoTest::create(['project_id' => $this->project()->id]);

        $this->beUser();
        $this->get('videos/999')->assertStatus(404);
        $this->get("videos/{$video->id}")->assertStatus(403);

        $this->beGuest();
        $this->get("videos/{$video->id}")->assertStatus(200);
    }

    public function testStore()
    {
        $id = $this->project()->id;

        // not logged in
        $response = $this->get('videos/create');
        $response->assertStatus(302);

        $this->beEditor();
        // user is not allowed to edit the project
        $response = $this->get("videos/create?project={$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        // project doesn't exist
        $response = $this->get('videos/create?project=-1');
        $response->assertStatus(404);

        $response = $this->get("videos/create?project={$id}");
        $response->assertStatus(200);
    }
}
