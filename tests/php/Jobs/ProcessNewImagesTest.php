<?php

namespace Biigle\Tests\Jobs;

use Queue;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\ProcessNewImages;
use Biigle\Jobs\ProcessNewImageChunk;

class ProcessNewImagesTest extends TestCase
{
    public function testHandle()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        Queue::fake();

        with(new ProcessNewImages($volume))->handle();

        Queue::assertPushed(ProcessNewImageChunk::class, function ($job) use ($i1, $i2) {
            return $job->ids[0] === $i1->id && $job->ids[1] === $i2->id;
        });
    }

    public function testHandleWithOnly()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        Queue::fake();

        with(new ProcessNewImages($volume, [$i1->id]))->handle();

        Queue::assertPushed(ProcessNewImageChunk::class, function ($job) use ($i1) {
            return $job->ids[0] === $i1->id && count($job->ids) === 1;
        });
    }
}
