<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\VideoMetadata;
use Biigle\Services\MetadataParsing\ImageMetadata;
use TestCase;

class VideoMetadataTest extends TestCase
{
    public function testIsEmpty()
    {
        $data = new VideoMetadata('filename');
        $this->assertTrue($data->isEmpty());
        $data->addFrame('2023-12-12 20:26:00');
        $this->assertFalse($data->isEmpty());

        $data = new VideoMetadata('filename', area: 10);
        $this->assertFalse($data->isEmpty());
    }

    public function testGetFrames()
    {
        $data = new VideoMetadata('filename');
        $this->assertTrue($data->getFrames()->isEmpty());

        $data = new VideoMetadata('filename', takenAt: '2023-12-12 20:26:00');
        $frame = $data->getFrames()->first();
        $this->assertEquals('filename', $frame->name);
        $this->assertEquals('2023-12-12 20:26:00', $frame->takenAt);
    }

    public function testAddFrame()
    {
        $data = new VideoMetadata('filename');
        $this->assertTrue($data->getFrames()->isEmpty());
        $data->addFrame('2023-12-12 20:26:00');
        $frame = $data->getFrames()->first();
        $this->assertEquals('filename', $frame->name);
        $this->assertEquals('2023-12-12 20:26:00', $frame->takenAt);
    }
}
