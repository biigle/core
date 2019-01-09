<?php

namespace Tests\Http\Controllers\Views;

use App\Video;
use Tests\TestCase;

class VideoControllerTest extends TestCase
{
    public function testShow()
    {
        $video = factory(Video::class)->create();

        $this->get('foo')->assertStatus(404);
        $this->get($video->uuid)->assertStatus(200);
    }
}
