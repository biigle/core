<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Services\MetadataParsing\ImageCsvParser;
use Biigle\Services\MetadataParsing\VideoCsvParser;
use Biigle\Tests\VolumeTest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use TestCase;

class CreateNewImagesOrVideosTest extends TestCase
{
    public function testHandleImages()
    {
        Event::fake();
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $filenames = ['a.jpg', 'b.jpg'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        Event::assertDispatched('images.created');
        $images = $volume->images()->pluck('filename')->toArray();
        $this->assertCount(2, $images);
        $this->assertContains('a.jpg', $images);
        $this->assertContains('b.jpg', $images);
    }

    public function testHandleVideos()
    {
        Event::fake();
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
        ]);
        $filenames = ['a.mp4', 'b.mp4'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        Event::assertNotDispatched('images.created');
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

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $this->assertFalse($volume->fresh()->creating_async);
    }

    public function testHandleImageMetadata()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => ImageCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw
        a.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180
        CSV);
        $filenames = ['a.jpg'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
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
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => ImageCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,lng,lat,gps_altitude
        a.jpg,52.220,28.123,
        CSV);
        $filenames = ['a.jpg'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $image = $volume->images()->first();
        $this->assertEquals(52.220, $image->lng);
        $this->assertEquals(28.123, $image->lat);
        $this->assertEmpty($image->metadata);
    }

    public function testHandleImageMetadataIncomplete()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => ImageCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,lng,lat
        a.jpg,52.220,28.123
        CSV);
        $filenames = ['a.jpg', 'b.jpg'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $this->assertEquals(2, $volume->images()->count());
    }

    public function testHandleVideoMetadata()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw
        a.mp4,2016-12-19 12:28:00,52.230,28.133,-1505,5,1.6,181
        a.mp4,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180
        CSV);
        $filenames = ['a.mp4'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $video = $volume->videos()->first();
        $expect = [
            Carbon::parse('2016-12-19 12:27:00'),
            Carbon::parse('2016-12-19 12:28:00'),
        ];
        $this->assertEquals($expect, $video->taken_at);
        $this->assertEquals([52.220, 52.230], $video->lng);
        $this->assertEquals([28.123, 28.133], $video->lat);
        $this->assertEquals([-1500, -1505], $video->metadata['gps_altitude']);
        $this->assertEquals([2.6, 1.6], $video->metadata['area']);
        $this->assertEquals([10, 5], $video->metadata['distance_to_ground']);
        $this->assertEquals([180, 181], $video->metadata['yaw']);
    }

    public function testHandleVideoMetadataEmptyCells()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,gps_altitude,distance_to_ground
        a.mp4,2016-12-19 12:28:00,,
        a.mp4,2016-12-19 12:27:00,-1500,
        CSV);
        $filenames = ['a.mp4'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $video = $volume->videos()->first();
        $expect = ['gps_altitude' => [-1500, null]];
        $this->assertSame($expect, $video->metadata);
    }

    public function testHandleVideoMetadataZeroSingle()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,distance_to_ground
        a.mp4,2016-12-19 12:27:00,0
        CSV);
        $filenames = ['a.mp4'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $video = $volume->videos()->first();
        $expect = ['distance_to_ground' => [0]];
        $this->assertSame($expect, $video->metadata);
    }

    public function testHandleVideoMetadataZero()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,distance_to_ground
        a.mp4,2016-12-19 12:27:00,0
        a.mp4,2016-12-19 12:28:00,1
        CSV);
        $filenames = ['a.mp4'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $video = $volume->videos()->first();
        $expect = ['distance_to_ground' => [0, 1]];
        $this->assertSame($expect, $video->metadata);
    }

    public function testHandleVideoMetadataBasic()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,gps_altitude
        a.mp4,-1500
        CSV);
        $filenames = ['a.mp4'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $video = $volume->videos()->first();
        $expect = ['gps_altitude' => [-1500]];
        $this->assertSame($expect, $video->metadata);
        $this->assertNull($video->taken_at);
    }

    public function testHandleVideoMetadataIncomplete()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,lng,lat
        a.mp4,2016-12-19 12:27:00,52.220,28.123
        CSV);
        $filenames = ['a.mp4', 'b.mp4'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $this->assertEquals(2, $volume->videos()->count());
    }

    public function testHandleMetadataDateParsing()
    {
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);
        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at
        a.jpg,05/01/2019 10:35
        CSV);
        $filenames = ['a.jpg'];

        with(new CreateNewImagesOrVideos($volume, $filenames))->handle();
        $image = $volume->images()->first();
        $this->assertEquals('2019-05-01 10:35:00', $image->taken_at);
    }
}
