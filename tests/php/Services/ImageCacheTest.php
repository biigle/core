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
        config(['image.cache.path' => $this->cachePath]);
    }

    public function testHandleExists()
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
            $cache->get($image);
            clearstatcache();
            $this->assertEquals(time(), fileatime($path));
        } finally {
            File::deleteDirectory($this->cachePath);
        }
    }

    public function testHandleRemote()
    {
        $volume = VolumeTest::create(['url' => 'https://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        try {
            $cache = new ImageCacheStub;
            $cache->stream = fopen(base_path('tests').'/files/test-image.jpg', 'r');
            $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
            $path = $cache->get($image);
            $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
            $this->assertEquals("{$this->cachePath}/{$image->id}", $path);
        } finally {
            File::deleteDirectory($this->cachePath);
            // Stream should be closed.
            $this->assertFalse(is_resource($cache->stream));
        }
    }

    public function testHandleRemoteTooLarge()
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
        $path = $cache->get($image);
    }

    public function testHandleDiskDoesNotExist()
    {
        $volume = VolumeTest::create(['url' => 'abc://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        try {
            ImageCache::get($image);
            $this->assertTrue(false);
        } catch (Exception $e) {
            $this->assertContains("disk 'abc' does not exist", $e->getMessage());
        }
    }

    public function testHandleDiskLocal()
    {
        $volume = VolumeTest::create(['url' => 'test://files']);
        $image = ImageTest::create([
            'filename' => 'test-image.jpg',
            'volume_id' => $volume->id,
        ]);
        File::shouldReceive('exists')->once()->andReturn(false);
        $this->assertEquals(base_path('tests').'/files/test-image.jpg', ImageCache::get($image));
    }

    public function testHandleDiskCloud()
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
            $path = ImageCache::get($image);
            $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
            $this->assertEquals("{$this->cachePath}/{$image->id}", $path);
        } finally {
            File::deleteDirectory($this->cachePath);
            // Stream should be closed.
            $this->assertFalse(is_resource($stream));
        }
    }

    public function testForget()
    {
        $image = ImageTest::create();

        File::makeDirectory($this->cachePath);
        touch("{$this->cachePath}/{$image->id}");
        try {
            $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
            ImageCache::forget($image);
            $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
        } finally {
            File::deleteDirectory($this->cachePath);
        }
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
    protected function getRemoteImageSize(\Biigle\Image $image)
    {
        return $this->size;
    }
    protected function getRemoteImageStream(\Biigle\Image $image)
    {
        return $this->stream;
    }
}
