<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Views;

use Biigle\Tests\TestCase;
use Biigle\Modules\Videos\Video;

class VideoControllerTest extends TestCase
{
    public function testShow()
    {
        $video = factory(Video::class)->create();

        $this->get('foo')->assertStatus(404);
        $this->get($video->uuid)->assertStatus(200);
    }
}
