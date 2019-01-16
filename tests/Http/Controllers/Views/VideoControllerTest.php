<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Tests\Modules\Videos\VideoTest;

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
}
