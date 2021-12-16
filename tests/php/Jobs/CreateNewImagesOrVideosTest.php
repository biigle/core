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

    public function testHandleImageMetadata()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $filenames = ['a.jpg'];
        $metadata = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['a.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];

        with(new CreateNewImagesOrVideos($volume, $filenames, $metadata))->handle();
        $image = $volume->images()->first();
        $this->assertEquals('2016-12-19 12:27:00', $image->taken_at);
        $this->assertEquals(52.220, $image->lng);
        $this->assertEquals(28.123, $image->lat);
        $this->assertEquals(-1500, $image->metadata['gps_altitude']);
        $this->assertEquals(2.6, $image->metadata['area']);
        $this->assertEquals(10, $image->metadata['distance_to_ground']);
        $this->assertEquals(180, $image->metadata['yaw']);
    }

    public function testHandleImageMetadataEmptyCells()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $filenames = ['a.jpg'];
        $metadata = [
            ['filename', 'lng', 'lat', 'gps_altitude'],
            ['a.jpg', '52.220', '28.123', ''],
        ];

        with(new CreateNewImagesOrVideos($volume, $filenames, $metadata))->handle();
        $image = $volume->images()->first();
        $this->assertEquals(52.220, $image->lng);
        $this->assertEquals(28.123, $image->lat);
        $this->assertEmpty($image->metadata);
    }

    public function testHandleImageMetadataDateParsing()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $filenames = ['a.jpg'];
        $metadata = [
            ['filename', 'taken_at'],
            ['a.jpg', '05/01/2019 10:35'],
        ];

        with(new CreateNewImagesOrVideos($volume, $filenames, $metadata))->handle();
        $image = $volume->images()->first();
        $this->assertEquals('2019-05-01 10:35:00', $image->taken_at);
    }
}
