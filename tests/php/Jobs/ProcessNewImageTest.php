<?php

namespace Biigle\Tests\Jobs;

use Biigle\Image;
use Biigle\Jobs\ProcessNewImage;
use Biigle\Jobs\TileSingleImage;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Jcupitt\Vips\Exception as VipsException;
use Log;
use Queue;
use Storage;
use TestCase;
use VipsImage;

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

        $this->assertEquals('2011-12-31 17:07:29', (string) $image->taken_at);
        $this->assertEqualsWithDelta(12.486211944, $image->lng, 0.000001);
        $this->assertEqualsWithDelta(41.8898575, $image->lat, 0.000001);
        $this->assertEquals(56.819, $image->metadata['gps_altitude']);
        $this->assertEquals(500, $image->width);
        $this->assertEquals(375, $image->height);
        $this->assertEquals(62411, $image->size);
        $this->assertEquals('image/jpeg', $image->mimetype);
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
        $this->assertEquals(null, $image->taken_at);
    }

    public function testHandleMakeThumbnail()
    {
        if (!function_exists('vips_call')) {
            $this->markTestSkipped('Requires the PHP vips extension.');
        }
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

        $this->assertTrue($size[0] <= $config[0]);
        $this->assertTrue($size[1] <= $config[1]);
        $this->assertTrue($size[0] == $config[0] || $size[1] == $config[1]);
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

        VipsImage::shouldReceive('newFromFile')
            ->once()
            ->andReturn(new ImageMock(100, 200));

        Queue::fake();
        with(new ProcessNewImageMock($image))->handle();

        Queue::assertNotPushed(TileSingleImage::class);
        $this->assertFalse($image->tiled);
    }

    public function testHandleTileLargeImage()
    {
        config(['image.tiles.threshold' => 300]);

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);

        VipsImage::shouldReceive('newFromFile')
            ->once()
            ->andReturn(new ImageMock(400, 200));

        Queue::fake();
        with(new ProcessNewImageMock($image))->handle();

        Queue::assertPushed(TileSingleImage::class, function ($job) use ($image) {
            return $job->image->id === $image->id;
        });
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
        $this->assertEquals($expect, $image->metadata);
    }
}

class ImageMock extends \Jcupitt\Vips\Image
{
    public $width;
    public $height;
    public function __construct($width, $height)
    {
        parent::__construct(null);
        $this->width = $width;
        $this->height = $height;
    }
}

class ProcessNewImageMock extends ProcessNewImage
{
    public $exif = false;
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
}
