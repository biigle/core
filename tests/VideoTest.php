<?php

namespace Biigle\Tests\Modules\Videos;

use Biigle\Modules\Videos\Video;
use Biigle\Tests\Modules\Videos\TestCase;

class VideoTest extends TestCase
{
    public function testModel()
    {
        $video = factory(Video::class)->create();
        $this->assertNotNull($video->name);
        $this->assertNotNull($video->uuid);
        $this->assertNotNull($video->created_at);
        $this->assertNotNull($video->updated_at);
        $this->assertEquals([], $video->meta);
    }
}
