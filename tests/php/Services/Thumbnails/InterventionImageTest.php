<?php

namespace Biigle\Tests\Services\Thumbnails;

use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\ProcessThumbnailChunkJob;
use Biigle\Services\Thumbnails\InterventionImage;

class InterventionImageTest extends TestCase
{
    public function testGenerateThumbnails()
    {
        $this->expectsJobs(ProcessThumbnailChunkJob::class);
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);
        $image2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => '2']);

        with(new InterventionImage)->generateThumbnails($volume, []);

        $this->assertEquals([$image->id, $image2->id], end($this->dispatchedJobs)->images->pluck('id')->toArray());
    }

    public function testGenerateThumbnailsWithOnly()
    {
        $this->expectsJobs(ProcessThumbnailChunkJob::class);
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);
        $image2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => '2']);

        with(new InterventionImage)->generateThumbnails($volume, [$image->id]);

        $this->assertEquals([$image->id], end($this->dispatchedJobs)->images->pluck('id')->toArray());
    }
}
