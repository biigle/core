<?php

namespace Biigle\Tests\Jobs;

use Biigle\Events\VolumeFilesProcessed;
use Biigle\Image;
use Biigle\Jobs\ProcessNewImage;
use Biigle\Jobs\TileSingleImage;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\User;
use Illuminate\Support\Facades\Event;
use Jcupitt\Vips\Exception as VipsException;
use Queue;
use Storage;
use TestCase;

class ProcessNewImageTest extends TestCase
{
    protected $user;

    public function setUp(): void
    {
        parent::setUp();
        Storage::fake(config('thumbnails.storage_disk'));
        Event::fake();
        $this->user = User::factory()->create();
    }

    public function testHandleCollectMetadata()
    {
        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
        ]);
        $this->assertFalse($volume->hasGeoInfo());

        with(new ProcessNewImageMock(collect([$image]), $this->user))->handle();

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
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleCollectMetadataZeroDate()
    {
        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
        ]);
        $this->assertFalse($volume->hasGeoInfo());

        $job = new ProcessNewImageMock(collect([$image]), $this->user);
        $job->exif = ['DateTimeOriginal' => '0000-00-00 00:00:00'];
        $job->handle();
        $image = $image->fresh();
        $this->assertSame(null, $image->taken_at);
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleCollectMetadataAreaYaw()
    {
        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        $job = new ProcessNewImageMock(collect([$image]), $this->user);
        $job->exif = [
            'GPSImgDirection' => "191/4",
            'SubjectArea' => "13/5",
        ];
        $job->handle();
        $image = $image->fresh();

        $this->assertSame(47.75, $image->metadata['yaw']);
        $this->assertSame(2.6, $image->metadata['area']);
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleMakeThumbnail()
    {
        Storage::fake('test-thumbs');
        config(['thumbnails.storage_disk' => 'test-thumbs']);

        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create(['volume_id' => $volume->id]);
        with(new ProcessNewImage(collect([$image]), $this->user))->handle();

        $prefix = fragment_uuid_path($image->uuid);
        $format = config('thumbnails.format');

        $this->assertTrue(Storage::disk('test-thumbs')->exists("{$prefix}.{$format}"));
        $size = getimagesize(Storage::disk('test-thumbs')->path("{$prefix}.{$format}"));
        $config = [config('thumbnails.width'), config('thumbnails.height')];

        $this->assertTrue($size[0] <= ($config[0] * 2));
        $this->assertTrue($size[1] <= ($config[1] * 2));
        $this->assertTrue($size[0] == ($config[0] * 2) || $size[1] == ($config[1] * 2));
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleMakeThumbnailNotReadable()
    {
        Storage::fake('test');
        Storage::disk('test')->put('files/broken.jpg', '');
        $image = ImageTest::create(['filename' => 'broken.jpg']);
        try {
            (new ProcessNewImage(collect([$image]), $this->user))->handle();
            $this->assertFalse(true);
        } catch (VipsException $e) {
            $this->assertStringContainsString('not a known file format', $e->getMessage());
        }
        Event::assertNotDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleTileSmallImage()
    {
        config(['image.tiles.threshold' => 300]);

        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $job = new ProcessNewImageMock(collect([$image]), $this->user);
        $job->vipsImage = new class {
            public $width = 100;
            public $height = 200;
        };

        Queue::fake();
        $job->handle();

        Queue::assertNotPushed(TileSingleImage::class);
        $this->assertFalse($image->tiled);
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleTileLargeImage()
    {
        config(['image.tiles.threshold' => 300]);

        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $job = new ProcessNewImageMock(collect([$image]), $this->user);
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
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleTileLargeImageSkipInProgress()
    {
        config(['image.tiles.threshold' => 300]);
        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'tiled' => true,
            'attrs' => ['tilingInProgress' => true],
        ]);

        Queue::fake();
        with(new ProcessNewImageMock(collect([$image]), $this->user))->handle();
        Queue::assertNotPushed(TileSingleImage::class);
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleTileLargeImageSkipFinished()
    {
        config(['image.tiles.threshold' => 300, 'image.tiles.disk' => 'tiles']);
        Storage::fake('tiles');

        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create(['volume_id' => $volume->id, 'tiled' => true]);
        $fragment = fragment_uuid_path($image->uuid);
        Storage::disk('tiles')->put("{$fragment}/ImageProperties.xml", 'test');

        Queue::fake();
        with(new ProcessNewImageMock(collect([$image]), $this->user))->handle();
        Queue::assertNotPushed(TileSingleImage::class);
        $this->assertFalse($image->tilingInProgress);
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testHandleMergeMetadata()
    {
        $volume = VolumeTest::create(['creator_id' => $this->user->id]);
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
            'attrs' => [
                'metadata' => ['distance_to_ground' => 5],
            ],
        ]);
        $this->assertFalse($volume->hasGeoInfo());

        $job = new ProcessNewImageMock(collect([$image]), $this->user);
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
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
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
