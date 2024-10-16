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
        
        $diskThumbs = Storage::fake('test-thumbs');
        $diskTiles = Storage::fake('test-tiles');

        $image = ImageTest::create();
        $prefix = fragment_uuid_path($image->uuid);
        $copyImage = ImageTest::create();
        $copyPrefix = fragment_uuid_path($copyImage->uuid);

        $img1 = '/img1.jpg';
        $img2 = '/img2.jpg';

        $p1 = $prefix.$img1;
        $p2 = $prefix.$img2;

        $diskThumbs->put($p1, '');
        $diskThumbs->put($p2, '');
        $diskTiles->put($p1, '');
        $diskTiles->put($p2, '');

        $this->assertFileExists($diskThumbs->path($p1));
        $this->assertFileExists($diskThumbs->path($p2));
        $this->assertFileExists($diskTiles->path($p1));
        $this->assertFileExists($diskTiles->path($p2));

        with(new CloneImageThumbnails($prefix, copyPrefix: $copyPrefix))->handle();

        $this->assertFileExists($diskThumbs->path($copyPrefix.$img1));
        $this->assertFileExists($diskThumbs->path($copyPrefix.$img2));
        $this->assertFileExists($diskTiles->path($copyPrefix.$img1));
        $this->assertFileExists($diskTiles->path($copyPrefix.$img2));
    }
}
