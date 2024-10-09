<?php

namespace Biigle\Tests\Jobs;

use Biigle\Image;
use Biigle\Jobs\ProcessNewImage;
use Biigle\Jobs\TileSingleImage;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Jcupitt\Vips\Exception as VipsException;
use Queue;
use Storage;
use TestCase;

class ProcessNewImageTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        Storage::fake(config('thumbnails.storage_disk'));
    }

    public function testHandleCollectMetadata()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
        ]);
        $this->assertFalse($volume->hasGeoInfo());

        with(new ProcessNewImageMock($image))->handle();

        $image = $image->fresh();

        $this->assertSame('2011-12-31 17:07:29', (string) $image->taken_at);
        $this->assertEqualsWithDelta(12.486211944, $image->lng, 0.000001);
        $this->assertEqualsWithDelta(41.8898575, $image->lat, 0.000001);
        $this->assertSame(56.819, $image->metadata['gps_altitude']);
        $this->assertSame(500, $image->width);
        $this->assertSame(375, $image->height);
        $this->assertSame(62411, $image->size);
        $this->assertSame('image/jpeg', $image->mimetype);
        $this->assertTrue($volume->hasGeoInfo());
    }

    public function testHandleCollectMetadataZeroDate()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
        ]);
        $this->assertFalse($volume->hasGeoInfo());

        $job = new ProcessNewImageMock($image);
        $job->exif = ['DateTimeOriginal' => '0000-00-00 00:00:00'];
        $job->handle();
        $image = $image->fresh();
        $this->assertSame(null, $image->taken_at);
    }

    public function testHandleCollectMetadataAreaYaw()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        $job = new ProcessNewImageMock($image);
        $job->exif = [
            'GPSImgDirection' => "191/4",
            'SubjectArea' => "13/5",
        ];
        $job->handle();
        $image = $image->fresh();

        $this->assertSame(47.75, $image->metadata['yaw']);
        $this->assertSame(2.6, $image->metadata['area']);
    }

    public function testHandleMakeThumbnail()
    {
        Storage::fake('test-thumbs');
        config(['thumbnails.storage_disk' => 'test-thumbs']);

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);
        with(new ProcessNewImage($image))->handle();

        $prefix = fragment_uuid_path($image->uuid);
        $format = config('thumbnails.format');

        $this->assertTrue(Storage::disk('test-thumbs')->exists("{$prefix}.{$format}"));
        $size = getimagesize(Storage::disk('test-thumbs')->path("{$prefix}.{$format}"));
        $config = [config('thumbnails.width'), config('thumbnails.height')];

        $this->assertTrue($size[0] <= ($config[0] * 2));
        $this->assertTrue($size[1] <= ($config[1] * 2));
        $this->assertTrue($size[0] == ($config[0] * 2) || $size[1] == ($config[1] * 2));
    }

    public function testHandleMakeThumbnailNotReadable()
    {
        Storage::fake('test');
        Storage::disk('test')->put('files/broken.jpg', '');
        $image = ImageTest::create(['filename' => 'broken.jpg']);
        try {
            (new ProcessNewImage($image))->handle();
            $this->assertFalse(true);
        } catch (VipsException $e) {
            $this->assertStringContainsString('not a known file format', $e->getMessage());
        }
    }

    public function testHandleTileSmallImage()
    {
        config(['image.tiles.threshold' => 300]);

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $job = new ProcessNewImageMock($image);
        $job->vipsImage = new class {
            public $width = 100;
            public $height = 200;
        };

        Queue::fake();
        $job->handle();

        Queue::assertNotPushed(TileSingleImage::class);
        $this->assertFalse($image->tiled);
    }

    public function testHandleTileLargeImage()
    {
        config(['image.tiles.threshold' => 300]);

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $job = new ProcessNewImageMock($image);
        $job->vipsImage = new class {
            public $width = 400;
            public $height = 200;
        };

        Queue::fake();
        $job->handle();

        Queue::assertPushed(TileSingleImage::class, fn ($job) => $job->image->id === $image->id);
        $image->refresh();
        $this->assertTrue($image->tiled);
        $this->assertTrue($image->tilingInProgress);
    }

    public function testHandleTileLargeImageSkipInProgress()
    {
        config(['image.tiles.threshold' => 300]);
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'tiled' => true,
            'attrs' => ['tilingInProgress' => true],
        ]);

        Queue::fake();
        with(new ProcessNewImageMock($image))->handle();
        Queue::assertNotPushed(TileSingleImage::class);
    }

    public function testHandleTileLargeImageSkipFinished()
    {
        config(['image.tiles.threshold' => 300, 'image.tiles.disk' => 'tiles']);
        Storage::fake('tiles');

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id, 'tiled' => true]);
        $fragment = fragment_uuid_path($image->uuid);
        Storage::disk('tiles')->put("{$fragment}/ImageProperties.xml", 'test');

        Queue::fake();
        with(new ProcessNewImageMock($image))->handle();
        Queue::assertNotPushed(TileSingleImage::class);
        $this->assertFalse($image->tilingInProgress);
    }

    public function testHandleMergeMetadata()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
            'attrs' => [
                'metadata' => ['distance_to_ground' => 5],
            ],
        ]);
        $this->assertFalse($volume->hasGeoInfo());

        $job = new ProcessNewImageMock($image);
        $job->exif = [
            'GPSAltitudeRef' => "\x00",
            'GPSAltitude' => 500,
        ];
        $job->handle();
        $image = $image->fresh();
        $expect = [
            'distance_to_ground' => 5,
            'gps_altitude' => 500,
        ];
        $this->assertSame($expect, $image->metadata);
    }
}

class ProcessNewImageMock extends ProcessNewImage
{
    public $exif = false;
    public $vipsImage = null;

    protected function makeThumbnail(Image $image, $path)
    {
        // do nothing
    }

    protected function getExif($path)
    {
        if ($this->exif) {
            return $this->exif;
        }

        return parent::getExif($path);
    }

    protected function getVipsImage($path)
    {
        return $this->vipsImage ?: parent::getVipsImage($path);
    }
}
