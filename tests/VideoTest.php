<?php

namespace Tests;

use App\Video;
use Tests\TestCase;

class ExampleTest extends TestCase
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
