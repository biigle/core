<?php

namespace Biigle\Tests\Http\Controllers\Views\Videos;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\VideoTest;

class VideoControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $this->markTestIncomplete('route should be videos/xxx/annotations');
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();
        $video = VideoTest::create(['volume_id' => $this->volume()->id]);

        $this->beUser();
        $this->get('videos/999')->assertStatus(404);
        $this->get("videos/{$video->id}")->assertStatus(403);

        $this->beGuest();
        $this->get("videos/{$video->id}")->assertStatus(200);
    }
}
