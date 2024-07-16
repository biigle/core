<?php

namespace Biigle\Tests\Http\Controllers\Views\Videos;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\VideoTest;

class VideoControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $video = VideoTest::create(['volume_id' => $id]);

        $this->beUser();
        $this->get('videos/999/annotations')->assertStatus(404);
        $this->get("videos/{$video->id}/annotations")->assertStatus(403);

        $this->beGuest();
        $this->get("videos/{$video->id}/annotations")->assertStatus(200);
    }

    public function testShowRedirect()
    {
        $this->beUser();
        $this->get('videos/999')->assertRedirect('/videos/999/annotations');
    }

    public function testVideoWithoutDimensions()
    {
        $this->beGuest();
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create(['volume_id' => $id, 'height' => NULL, 'width' => NULL]);
        $this->get("videos/{$video->id}/annotations")->assertStatus(200);

        $video = VideoTest::create(['volume_id' => $id, 'height' => 0, 'width' => 0]);
        $this->get("videos/{$video->id}/annotations")->assertStatus(200);

        $video = VideoTest::create(['volume_id' => $id]);
        $this->get("videos/{$video->id}/annotations")->assertStatus(200);
    }
}
