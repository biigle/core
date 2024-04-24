<?php

namespace Biigle\Tests\Jobs;

use Biigle\Image;
use Biigle\Jobs\UpdateVolumeMetadata;
use Biigle\MediaType;
use Biigle\Services\MetadataParsing\ImageCsvParser;
use Biigle\Services\MetadataParsing\VideoCsvParser;
use Biigle\Video;
use Biigle\Volume;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use TestCase;

class UpdateVolumeMetadataTest extends TestCase
{
    public function testHandleImageAdd()
    {
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::imageId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => ImageCsvParser::class,
        ]);

        $image = Image::factory()->create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id,
            'attrs' => [
                'size' => 100,
            ],
        ]);


        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw
        a.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180
        CSV);

        $this->assertFalse($volume->hasGeoInfo());

        with(new UpdateVolumeMetadata($volume))->handle();
        $image->refresh();
        $this->assertEquals(100, $image->size);
        $this->assertEquals('2016-12-19 12:27:00', $image->taken_at);
        $this->assertEquals(52.220, $image->lng);
        $this->assertEquals(28.123, $image->lat);
        $this->assertEquals(-1500, $image->metadata['gps_altitude']);
        $this->assertEquals(10, $image->metadata['distance_to_ground']);
        $this->assertEquals(2.6, $image->metadata['area']);
        $this->assertEquals(180, $image->metadata['yaw']);
        $this->assertTrue($volume->hasGeoInfo());
    }

    public function testHandleImageUpdate()
    {
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::imageId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => ImageCsvParser::class,
        ]);

        $image = Image::factory()->create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id,
            'taken_at' => '2024-03-12 11:23:00',
            'lng' => 12,
            'lat' => 34,
            'attrs' => [
                'size' => 100,
                'metadata' => [
                    'gps_altitude' => -1000,
                    'distance_to_ground' => 5,
                    'area' => 2.5,
                    'yaw' => 100,
                ],
            ],
        ]);


        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw
        a.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180
        CSV);

        with(new UpdateVolumeMetadata($volume))->handle();
        $image->refresh();
        $this->assertEquals(100, $image->size);
        $this->assertEquals('2016-12-19 12:27:00', $image->taken_at);
        $this->assertEquals(52.220, $image->lng);
        $this->assertEquals(28.123, $image->lat);
        $this->assertEquals(-1500, $image->metadata['gps_altitude']);
        $this->assertEquals(10, $image->metadata['distance_to_ground']);
        $this->assertEquals(2.6, $image->metadata['area']);
        $this->assertEquals(180, $image->metadata['yaw']);
    }

    public function testHandleImageMerge()
    {
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::imageId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => ImageCsvParser::class,
        ]);

        $image = Image::factory()->create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id,
            'lng' => 12,
            'lat' => 34,
            'attrs' => [
                'size' => 100,
                'metadata' => [
                    'gps_altitude' => -1000,
                    'distance_to_ground' => 5,
                ],
            ],
        ]);


        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,gps_altitude,
        a.jpg,2016-12-19 12:27:00,-1500
        CSV);

        with(new UpdateVolumeMetadata($volume))->handle();
        $image->refresh();
        $this->assertEquals(100, $image->size);
        $this->assertEquals('2016-12-19 12:27:00', $image->taken_at);
        $this->assertEquals(12, $image->lng);
        $this->assertEquals(34, $image->lat);
        $this->assertEquals(-1500, $image->metadata['gps_altitude']);
        $this->assertEquals(5, $image->metadata['distance_to_ground']);
        $this->assertArrayNotHasKey('area', $image->metadata);
        $this->assertArrayNotHasKey('yaw', $image->metadata);
    }

    public function testHandleVideoAdd()
    {
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);

        $video = Video::factory()->create([
            'filename' => 'a.mp4',
            'volume_id' => $volume->id,
            'attrs' => [
                'size' => 100,
            ],
        ]);


        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw
        a.mp4,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180
        CSV);

        with(new UpdateVolumeMetadata($volume))->handle();
        $video->refresh();
        $this->assertEquals(100, $video->size);
        $this->assertEquals([Carbon::parse('2016-12-19 12:27:00')], $video->taken_at);
        $this->assertEquals([52.220], $video->lng);
        $this->assertEquals([28.123], $video->lat);
        $this->assertEquals([-1500], $video->metadata['gps_altitude']);
        $this->assertEquals([10], $video->metadata['distance_to_ground']);
        $this->assertEquals([2.6], $video->metadata['area']);
        $this->assertEquals([180], $video->metadata['yaw']);
    }

    public function testHandleVideoUpdate()
    {
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);

        $video = Video::factory()->create([
            'filename' => 'a.mp4',
            'volume_id' => $volume->id,
            'taken_at' => ['2024-03-12 11:23:00'],
            'lng' => [12],
            'lat' => [34],
            'attrs' => [
                'size' => 100,
                'metadata' => [
                    'gps_altitude' => [-1000],
                    'distance_to_ground' => [5],
                    'area' => [2.5],
                    'yaw' => [100],
                ],
            ],
        ]);


        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw
        a.mp4,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180
        CSV);

        with(new UpdateVolumeMetadata($volume))->handle();
        $video->refresh();
        $this->assertEquals(100, $video->size);
        $this->assertEquals([Carbon::parse('2016-12-19 12:27:00')], $video->taken_at);
        $this->assertEquals([52.220], $video->lng);
        $this->assertEquals([28.123], $video->lat);
        $this->assertEquals([-1500], $video->metadata['gps_altitude']);
        $this->assertEquals([10], $video->metadata['distance_to_ground']);
        $this->assertEquals([2.6], $video->metadata['area']);
        $this->assertEquals([180], $video->metadata['yaw']);
    }

    public function testHandleVideoMergeWithoutTakenAt()
    {
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);

        $video = Video::factory()->create([
            'filename' => 'a.mp4',
            'volume_id' => $volume->id,
            'lng' => [12],
            'lat' => [34],
            'attrs' => [
                'size' => 100,
                'metadata' => [
                    'gps_altitude' => [-1000],
                    'distance_to_ground' => [5],
                ],
            ],
        ]);


        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,gps_altitude,
        a.mp4,-1500
        CSV);

        with(new UpdateVolumeMetadata($volume))->handle();
        $video->refresh();
        $this->assertEquals(100, $video->size);
        $this->assertNull($video->taken_at);
        $this->assertEquals([12], $video->lng);
        $this->assertEquals([34], $video->lat);
        $this->assertEquals([-1500], $video->metadata['gps_altitude']);
        $this->assertEquals([5], $video->metadata['distance_to_ground']);
        $this->assertArrayNotHasKey('area', $video->metadata);
        $this->assertArrayNotHasKey('yaw', $video->metadata);
    }

    public function testHandleVideoReplaceWithTakenAt()
    {
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.csv',
            'metadata_parser' => VideoCsvParser::class,
        ]);

        $video = Video::factory()->create([
            'filename' => 'a.mp4',
            'volume_id' => $volume->id,
            'lng' => [12],
            'lat' => [34],
            'attrs' => [
                'size' => 100,
                'metadata' => [
                    'gps_altitude' => [-1000],
                    'distance_to_ground' => [5],
                ],
            ],
        ]);


        $disk = Storage::fake('metadata');
        $disk->put($volume->metadata_file_path, <<<CSV
        filename,taken_at,gps_altitude,
        a.mp4,2016-12-19 12:27:00,-1500
        CSV);

        with(new UpdateVolumeMetadata($volume))->handle();
        $video->refresh();
        $this->assertEquals(100, $video->size);
        $this->assertEquals([Carbon::parse('2016-12-19 12:27:00')], $video->taken_at);
        $this->assertNull($video->lng);
        $this->assertNull($video->lat);
        $this->assertEquals([-1500], $video->metadata['gps_altitude']);
        $this->assertArrayNotHasKey('distance_to_ground', $video->metadata);
        $this->assertArrayNotHasKey('area', $video->metadata);
        $this->assertArrayNotHasKey('yaw', $video->metadata);
    }
}
