<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Queue;
use TestCase;

class CreateNewImagesOrVideosTest extends TestCase
{
    public function testHandleImages()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $filenames = ['a.jpg', 'b.jpg'];

        Queue::fake();
        $this->expectsEvents('images.created');
        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        $images = $volume->images()->pluck('filename')->toArray();
        $this->assertCount(2, $images);
        $this->assertContains('a.jpg', $images);
        $this->assertContains('b.jpg', $images);
    }

    public function testHandleVideos()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
        ]);
        $filenames = ['a.mp4', 'b.mp4'];

        Queue::fake();
        $this->doesntExpectEvents('images.created');
        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        $images = $volume->videos()->pluck('filename')->toArray();
        $this->assertCount(2, $images);
        $this->assertContains('a.mp4', $images);
        $this->assertContains('b.mp4', $images);
    }

    public function testHandleAsync()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
            'attrs' => [
                'creating_async' => true,
            ],
        ]);
        $filenames = ['a.jpg', 'b.jpg'];

        Queue::fake();
        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $this->assertFalse($volume->fresh()->creating_async);
    }
}
