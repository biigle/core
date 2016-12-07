<?php

use Copria\Transect;
use Dias\Jobs\CollectImageMetaInfo;

class JobsCollectImageMetaInfoTest extends TestCase
{
    public function testHandle()
    {
        $transect = TransectTest::create();
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'transect_id' => $transect->id,
        ]);

        with(new CollectImageMetaInfo($transect))->handle();

        $image = $image->fresh();

        $this->assertEquals('2011-12-31 17:07:29', (string) $image->taken_at);
        $this->assertEquals(12.486211944, $image->lng, '',0.000001);
        $this->assertEquals(41.8898575, $image->lat, '',0.000001);
    }

    public function testHandleRemote()
    {
        $transect = TransectTest::create(['url' => 'http://localhost']);
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'transect_id' => $transect->id,
        ]);

        with(new CollectImageMetaInfo($transect))->handle();

        $image = $image->fresh();

        $this->assertNull($image->taken_at);
        $this->assertNull($image->lng);
        $this->assertNull($image->lat);
    }
}
