<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\CloneImageThumbnails;
use Biigle\Jobs\ProcessNewImage;
use Biigle\Tests\ImageTest;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use TestCase;

class CloneImageThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        config(['thumbnails.storage_disk' => 'test-thumbs']);
        config(['image.tiles.disk' => 'test-tiles']);
        $format = config('thumbnails.format');

        $diskThumbs = Storage::fake('test-thumbs');
        $diskTiles = Storage::fake('test-tiles');

        $image = ImageTest::create();
        $prefix = fragment_uuid_path($image->uuid);
        $copyImage = ImageTest::create();
        $copyPrefix = fragment_uuid_path($copyImage->uuid);

        $i1 = $prefix.".{$format}";
        $i2 = $prefix.".{$format}";

        $ti1 = "/TileGroup0/tiled1.jpg";
        $ti2 = "/ImageProperties.xml";

        $diskThumbs->put($i1, '');
        $diskThumbs->put($i2, '');
        $diskTiles->put($prefix.$ti1, '');
        $diskTiles->put($prefix.$ti2, '');

        $this->assertFileExists($diskThumbs->path($i1));
        $this->assertFileExists($diskThumbs->path($i2));
        $this->assertFileExists($diskTiles->path($prefix.$ti1));
        $this->assertFileExists($diskTiles->path($prefix.$ti2));

        Queue::fake();
        with(new CloneImageThumbnails($copyImage, $prefix))->handle();
        Queue::assertNotPushed(ProcessNewImage::class);

        $this->assertFileExists($diskThumbs->path($copyPrefix.".{$format}"));
        $this->assertFileExists($diskThumbs->path($copyPrefix.".{$format}"));
        $this->assertFileExists($diskTiles->path($copyPrefix.$ti1));
        $this->assertFileExists($diskTiles->path($copyPrefix.$ti2));
    }

    public function testHandleMissingData()
    {
        config(['thumbnails.storage_disk' => 'test-thumbs']);
        config(['image.tiles.disk' => 'test-tiles']);
        Storage::fake('test-thumbs');
        Storage::fake('test-tiles');
    
        $image = ImageTest::create();
        $prefix = fragment_uuid_path($image->uuid);
        $copyImage = ImageTest::create();
    
        Queue::fake();
        with(new CloneImageThumbnails($copyImage, $prefix))->handle();
        Queue::assertPushed(ProcessNewImage::class);
    }

    public function testHandleMissingTiles()
    {
        config(['thumbnails.storage_disk' => 'test-thumbs']);
        config(['image.tiles.disk' => 'test-tiles']);
        $format = config('thumbnails.format');

        $diskThumbs = Storage::fake('test-thumbs');
        Storage::fake('test-tiles');

        $image = ImageTest::create();
        $prefix = fragment_uuid_path($image->uuid);
        $copyImage = ImageTest::create();

        $i1 = $prefix.".{$format}";
        $i2 = $prefix.".{$format}";

        $diskThumbs->put($i1, '');
        $diskThumbs->put($i2, '');

        $this->assertFileExists($diskThumbs->path($i1));
        $this->assertFileExists($diskThumbs->path($i2));

        Queue::fake();
        with(new CloneImageThumbnails($copyImage, $prefix))->handle();
        Queue::assertPushed(ProcessNewImage::class);
    }

    public function testHandleMissingThumbnail()
    {
        config(['thumbnails.storage_disk' => 'test-thumbs']);
        config(['image.tiles.disk' => 'test-tiles']);

        Storage::fake('test-thumbs');
        $diskTiles = Storage::fake('test-tiles');

        $image = ImageTest::create();
        $prefix = fragment_uuid_path($image->uuid);
        $copyImage = ImageTest::create();

        $ti1 = "/TileGroup0/tiled1.jpg";
        $ti2 = "/ImageProperties.xml";

        $diskTiles->put($prefix.$ti1, '');
        $diskTiles->put($prefix.$ti2, '');

        $this->assertFileExists($diskTiles->path($prefix.$ti1));
        $this->assertFileExists($diskTiles->path($prefix.$ti2));

        Queue::fake();
        with(new CloneImageThumbnails($copyImage, $prefix))->handle();
        Queue::assertPushed(ProcessNewImage::class);
    }
}
