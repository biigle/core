<?php

namespace Biigle\Tests\Services;

use Phar;
use File;
use Storage;
use TestCase;
use PharData;
use TileCache;
use Exception;
use Biigle\Tests\ImageTest;

class TileCacheTest extends TestCase
{
    public function testGet()
    {
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        Storage::fake('local-tiles');
        $disk = Storage::disk('local-tiles');
        // Create some file so the fragment directory exists.
        $disk->put("{$fragment}.txt", '');
        $prefix = $disk->getDriver()->getAdapter()->getPathPrefix();
        $archive = new PharData("{$prefix}/{$fragment}.tar");
        $archive->addFromString("ImageProperties.xml", '<IMAGE_PROPERTIES/>');
        $archive->compress(Phar::GZ);

        try {
            $path = TileCache::get($image);
            $this->assertTrue(File::exists("{$path}/ImageProperties.xml"));
        } finally {
            File::deleteDirectory(File::dirname(File::dirname($path)));
        }
    }

    public function testGetError()
    {
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        Storage::fake('local-tiles');
        $disk = Storage::disk('local-tiles');
        // Create an invalid TAR file.
        $disk->put("{$fragment}.tar.gz", 'a');
        $this->expectException(Exception::class);
        $path = TileCache::get($image);
    }

    public function testGetNotFound()
    {
        $image = ImageTest::create();
        Storage::fake('local-tiles');
        $this->assertFalse(TileCache::get($image));
    }

    public function testPrune()
    {
        $cachePath = config('image.tiles.cache.path');
        config(['image.tiles.cache.max_size' => 5]);

        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        $path = "{$cachePath}/{$fragment}";
        File::makeDirectory("{$path}/TileGroup0", 0755, true, true);
        File::put("{$path}/ImageProperties.xml", '01234');
        File::put("{$path}/TileGroup0/img.jpg", '56789');

        try {
            $this->assertTrue(File::exists("{$path}"));
            TileCache::prune();
            $this->assertFalse(File::exists("{$path}"));
        } finally {
            File::deleteDirectory(File::dirname(File::dirname($path)));
        }
    }

    public function testClear()
    {
        $cachePath = config('image.tiles.cache.path');
        File::makeDirectory("{$cachePath}/abcd", 0755, true, true);
        TileCache::clear();
        $this->assertFalse(File::exists("{$cachePath}/abcd"));
    }
}
