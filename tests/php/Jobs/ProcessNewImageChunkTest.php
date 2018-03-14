<?php

namespace Biigle\Tests\Jobs;

use Log;
use File;
use Queue;
use Storage;
use TestCase;
use VipsImage;
use Biigle\Image;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\TileSingleImage;
use Biigle\Jobs\ProcessNewImageChunk;

class ProcessNewImageChunkTest extends TestCase
{
    public function testHandleCollectMetadata()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'exif-test.jpg',
            'volume_id' => $volume->id,
        ]);
        $this->assertFalse($volume->hasGeoInfo());

        with(new ProcessNewImageChunkMock([$image->id]))->handle();

        $image = $image->fresh();

        $this->assertEquals('2011-12-31 17:07:29', (string) $image->taken_at);
        $this->assertEquals(12.486211944, $image->lng, '', 0.000001);
        $this->assertEquals(41.8898575, $image->lat, '', 0.000001);
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

        $job = new ProcessNewImageChunkMock([$image->id]);
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

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $this->assertFalse(File::exists($image->thumbPath));

        with(new ProcessNewImageChunk([$image->id]))->handle();

        $this->assertTrue(File::exists($image->thumbPath));
        $size = getimagesize($image->thumbPath);
        $config = [config('thumbnails.width'), config('thumbnails.height')];

        $this->assertTrue($size[0] <= $config[0]);
        $this->assertTrue($size[1] <= $config[1]);
        $this->assertTrue($size[0] == $config[0] || $size[1] == $config[1]);

        $this->cleanup($image);
    }

    public function testHandleMakeThumbnailNotReadable()
    {
        if (!function_exists('vips_call')) {
            $this->markTestSkipped('Requires the PHP vips extension.');
        }

        Log::shouldReceive('error')->once();
        $image = ImageTest::create(['filename' => 'does_not_exist']);
        with(new ProcessNewImageChunk([$image->id]))->handle();
        $this->cleanup($image, false);
    }

    public function testHandleMakeThumbnailSkipExisting()
    {
        VipsImage::shouldReceive('thumbnail')->never();
        $image = ImageTest::create(['filename' => 'random']);
        File::makeDirectory(File::dirname($image->thumbPath), 0755, true, true);
        touch($image->thumbPath);

        try {
            with(new ProcessNewImageChunk([$image->id]))->handle();
        } finally {
            $this->cleanup($image);
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
        with(new ProcessNewImageChunkMock([$image->id]))->handle();

        Queue::assertNotPushed(TileSingleImage::class);
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
        with(new ProcessNewImageChunkMock([$image->id]))->handle();

        Queue::assertPushed(TileSingleImage::class, function ($job) use ($image) {
            return $job->image->id === $image->id;
        });
    }

    public function testHandleTileLargeImageSkip()
    {
        config(['image.tiles.threshold' => 300]);
        Storage::fake('local-tiles');

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id, 'tiled' => true]);
        $fragment = fragment_uuid_path($image->uuid);
        Storage::disk('local-tiles')->put($fragment, 'test');

        Queue::fake();
        with(new ProcessNewImageChunkMock([$image->id]))->handle();

        Queue::assertNotPushed(TileSingleImage::class);
    }

    protected function cleanup($image, $exists = true)
    {
        $this->assertTrue(File::delete($image->thumbPath) === $exists);
        // These directories may contain other thumbnails from a development instance.
        @rmdir(dirname($image->thumbPath, 1));
        @rmdir(dirname($image->thumbPath, 2));
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

class ProcessNewImageChunkMock extends ProcessNewImageChunk
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
