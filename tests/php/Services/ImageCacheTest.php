<?php

namespace Biigle\Tests\Services;

use File;
use Mockery;
use TestCase;
use Exception;
use ImageCache;
use Biigle\Tests\ImageTest;

class ImageCacheTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->cachePath = sys_get_temp_dir().'/biigle_remote_cache_test';
        config(['image.cache.path' => $this->cachePath]);
    }

    public function testHandleLocal()
    {
        $image = ImageTest::create();
        File::shouldReceive('copy')->never();
        $this->assertEquals($image->url, ImageCache::get($image));
    }

    public function testHandle()
    {
        $image = ImageTest::create();
        $mock = Mockery::mock();
        $mock->shouldReceive('isRemote')->once()->andReturn(true);
        $mock->url = $image->volume->url;
        $image->volume = $mock;

        try {
            $cache = new ImageCacheStub;
            $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
            $path = $cache->get($image);
            $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
            $this->assertEquals("{$this->cachePath}/{$image->id}", $path);
        } finally {
            File::deleteDirectory($this->cachePath);
        }
    }

    public function testHandleExists()
    {
        $image = ImageTest::create();
        $mock = Mockery::mock();
        $mock->shouldReceive('isRemote')->once()->andReturn(true);
        $mock->url = $image->volume->url;
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

    public function testHandleTooLarge()
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
    protected function getRemoteImageSize(\Biigle\Image $image)
    {
        return $this->size;
    }
}
