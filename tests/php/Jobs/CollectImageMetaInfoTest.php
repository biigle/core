<?php

namespace Biigle\Tests\Jobs;

use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\CollectImageMetaInfo;

class CollectImageMetaInfoTest extends TestCase
{
    public function testHandle()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
        ]);

        with(new CollectImageMetaInfo($volume))->handle();

        $image = $image->fresh();

        $this->assertEquals('2011-12-31 17:07:29', (string) $image->taken_at);
        $this->assertEquals(12.486211944, $image->lng, '', 0.000001);
        $this->assertEquals(41.8898575, $image->lat, '', 0.000001);
        $this->assertEquals(56.819, $image->metadata['gps_altitude']);
    }

    public function testHandleRemote()
    {
        $volume = VolumeTest::create(['url' => 'http://localhost']);
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
        ]);

        with(new CollectImageMetaInfo($volume))->handle();

        $image = $image->fresh();

        $this->assertNull($image->taken_at);
        $this->assertNull($image->lng);
        $this->assertNull($image->lat);
    }
}
