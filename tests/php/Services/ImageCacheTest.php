<?php

namespace Biigle\Tests\Services;

use File;
use Storage;
use Mockery;
use TestCase;
use Exception;
use ImageCache;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;

class ImageCacheTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->cachePath = sys_get_temp_dir().'/biigle_remote_cache_test';
        $this->noop = function ($image, $path) {
            return $path;
        };
        config(['image.cache.path' => $this->cachePath]);
    }

    public function testDoWithExists()
    {
        $image = ImageTest::create();
        $mock = Mockery::mock();
        $mock->shouldReceive('isRemote')->never();
        $image->volume = $mock;

        try {
            $path = "{$this->cachePath}/{$image->id}";
            File::makeDirectory($this->cachePath);
            touch($path, time() - 1);

            $cache = new ImageCacheStub;
            $this->assertNotEquals(time(), fileatime($path));
            $cache->doWith($image, $this->noop);
            clearstatcache();
            $this->assertEquals(time(), fileatime($path));
        } finally {
            File::deleteDirectory($this->cachePath);
        }
    }

    public function testDoWithRemote()
    {
        $volume = VolumeTest::create(['url' => 'https://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        try {
            $cache = new ImageCacheStub;
            $cache->size = 10;
            $cache->stream = fopen(base_path('tests').'/files/test-image.jpg', 'r');
            $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
            $path = $cache->doWith($image, $this->noop);
            $this->assertEquals("{$this->cachePath}/{$image->id}", $path);
            $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
        } finally {
            File::deleteDirectory($this->cachePath);
            // Stream should be closed.
            $this->assertFalse(is_resource($cache->stream));
        }
    }

    public function testDoWithRemoteTooLarge()
    {
        $image = ImageTest::create();
        $mock = Mockery::mock();
        $mock->shouldReceive('isRemote')->once()->andReturn(true);
        $mock->url = $image->volume->url;
        $image->volume = $mock;
        config(['image.cache.max_image_size' => 1]);

        $cache = new ImageCacheStub;
        $cache->size = 2;
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('File too large');
        $path = $cache->doWith($image, function () {});
    }

    public function testDoWithDiskDoesNotExist()
    {
        $volume = VolumeTest::create(['url' => 'abc://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        try {
            ImageCache::doWith($image, $this->noop);
            $this->assertTrue(false);
        } catch (Exception $e) {
            $this->assertContains("disk 'abc' does not exist", $e->getMessage());
        }
    }

    public function testDoWithDiskLocal()
    {
        $volume = VolumeTest::create(['url' => 'test://files']);
        $image = ImageTest::create([
            'filename' => 'test-image.jpg',
            'volume_id' => $volume->id,
        ]);
        File::shouldReceive('exists')->once()->andReturn(false);
        $path = ImageCache::doWith($image, $this->noop);
        $this->assertEquals(base_path('tests').'/files/test-image.jpg', $path);
    }

    public function testDoWithDiskCloud()
    {
        $volume = VolumeTest::create(['url' => 's3://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $stream = fopen(base_path('tests').'/files/test-image.jpg', 'r');

        $mock = Mockery::mock();
        $mock->shouldReceive('getDriver')->once()->andReturn($mock);
        $mock->shouldReceive('getAdapter')->once()->andReturn($mock);
        $mock->shouldReceive('size')->once()->andReturn(10);
        $mock->shouldReceive('readStream')->once()->andReturn($stream);
        Storage::shouldReceive('disk')->once()->with('s3')->andReturn($mock);

        try {
            $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
            $path = ImageCache::doWith($image, $this->noop);
            $this->assertEquals("{$this->cachePath}/{$image->id}", $path);
            $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
        } finally {
            File::deleteDirectory($this->cachePath);
            // Stream should be closed.
            $this->assertFalse(is_resource($stream));
        }
    }

    public function testDoWithOnce()
    {
        $image = ImageTest::create();
        File::makeDirectory($this->cachePath);
        touch("{$this->cachePath}/{$image->id}");
        try {
            $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
            ImageCache::doWithOnce($image, $this->noop);
            $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
        } finally {
            File::deleteDirectory($this->cachePath);
        }
    }

    public function testGetStreamCached()
    {
        $image = ImageTest::create();

        try {
            $path = "{$this->cachePath}/{$image->id}";
            File::makeDirectory($this->cachePath);
            touch($path, time() - 1);

            $cache = new ImageCacheStub;
            $cache->stream = 'abc123';
            $this->assertNotEquals(time(), fileatime($path));
            $expect = [
                'stream' => 'abc123',
                'mime' => 'inode/x-empty',
                'size' => 0,
            ];
            $this->assertEquals($expect, $cache->getStream($image));
            clearstatcache();
            $this->assertEquals(time(), fileatime($path));
        } finally {
            File::deleteDirectory($this->cachePath);
        }
    }

    public function testGetStreamRemote()
    {
        $volume = VolumeTest::create(['url' => 'https://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        try {
            $cache = new ImageCacheStub;
            $cache->stream = 'abc123';
            $cache->size = 12;
            $expect = [
                'stream' => 'abc123',
                'mime' => 'image/jpeg',
                'size' => '12',
            ];
            $this->assertEquals($expect, $cache->getStream($image));
        } finally {
            File::deleteDirectory($this->cachePath);
        }
    }

    public function testGetStreamDisk()
    {
        Storage::fake('test');
        Storage::disk('test')->put('files/test.txt', 'test123');

        $volume = VolumeTest::create(['url' => 'test://files']);
        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => 'test.txt',
        ]);

        $array = ImageCache::getStream($image);
        $this->assertEquals(7, $array['size']);
        $this->assertEquals('text/plain', $array['mime']);
        $this->assertTrue(is_resource($array['stream']));
        fclose($array['stream']);
    }

    public function testClean()
    {
        File::makeDirectory($this->cachePath);
        File::put("{$this->cachePath}/abc", 'abc');
        touch("{$this->cachePath}/abc", time() - 1);
        File::put("{$this->cachePath}/def", 'def');
        config(['image.cache.max_size' => 3]);

        ImageCache::clean();
        $this->assertFalse(File::exists("{$this->cachePath}/abc"));
        $this->assertTrue(File::exists("{$this->cachePath}/def"));

        config(['image.cache.max_size' => 0]);
        ImageCache::clean();
        $this->assertFalse(File::exists("{$this->cachePath}/def"));

        File::deleteDirectory($this->cachePath);
    }
}

class ImageCacheStub extends \Biigle\Services\ImageCache
{
    public $size = 0;
    public $stream = null;
    protected function getRemoteImageHeaders(\Biigle\Image $image)
    {
        return [
            'Content-Length' => ["$this->size"],
            'Content-Type' => ['image/jpeg'],
        ];
    }

    protected function getImageStream($url)
    {
        return $this->stream;
    }
}
