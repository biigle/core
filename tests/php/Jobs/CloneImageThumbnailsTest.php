<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\CloneImageThumbnails;
use Biigle\Tests\ImageTest;
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
        $ti2 = "/tileData.xml";

        $diskThumbs->put($i1, '');
        $diskThumbs->put($i2, '');
        $diskTiles->put($prefix.$ti1, '');
        $diskTiles->put($prefix.$ti2, '');

        $this->assertFileExists($diskThumbs->path($i1));
        $this->assertFileExists($diskThumbs->path($i2));
        $this->assertFileExists($diskTiles->path($prefix.$ti1));
        $this->assertFileExists($diskTiles->path($prefix.$ti2));

        with(new CloneImageThumbnails($prefix, copyPrefix: $copyPrefix))->handle();

        $this->assertFileExists($diskThumbs->path($copyPrefix.".{$format}"));
        $this->assertFileExists($diskThumbs->path($copyPrefix.".{$format}"));
        $this->assertFileExists($diskTiles->path($copyPrefix.$ti1));
        $this->assertFileExists($diskTiles->path($copyPrefix.$ti2));
    }
}
