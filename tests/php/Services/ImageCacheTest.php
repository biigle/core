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
        File::makeDirectory($this->cachePath, 0755, false, true);
    }

    public function tearDown()
    {
        parent::tearDown();
        File::deleteDirectory($this->cachePath);
    }

    public function testGetExists()
    {
        $image = ImageTest::create();
        $mock = Mockery::mock();
        $mock->shouldReceive('isRemote')->never();
        $image->volume = $mock;

        $path = "{$this->cachePath}/{$image->id}";
        touch($path, time() - 1);

        $cache = new ImageCacheStub;
        $this->assertNotEquals(time(), fileatime($path));
        $cache->get($image, $this->noop);
        clearstatcache();
        $this->assertEquals(time(), fileatime($path));
    }

    public function testGetRemote()
    {
        $volume = VolumeTest::create(['url' => 'https://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $cache = new ImageCacheStub;
        $cache->size = 10;
        $cache->stream = fopen(base_path('tests').'/files/test-image.jpg', 'r');
        $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
        $path = $cache->get($image, $this->noop);
        $this->assertEquals("{$this->cachePath}/{$image->id}", $path);
        $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
        $this->assertFalse(is_resource($cache->stream));
    }

    public function testGetRemoteTooLarge()
    {
        $volume = VolumeTest::create(['url' => 'http://example.com']);
        $image = ImageTest::create(['volume_id' => $volume]);
        config(['image.cache.max_image_size' => 1]);

        $cache = new ImageCacheStub;
        $cache->stream = fopen(base_path('tests').'/files/test-image.jpg', 'r');
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('file is too large');
        $path = $cache->get($image, $this->noop);
    }

    public function testGetDiskDoesNotExist()
    {
        $volume = VolumeTest::create(['url' => 'abc://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        try {
            ImageCache::get($image, $this->noop);
            $this->assertTrue(false);
        } catch (Exception $e) {
            $this->assertContains("disk 'abc' does not exist", $e->getMessage());
        }
    }

    public function testGetDiskLocal()
    {
        $volume = VolumeTest::create(['url' => 'test://files']);
        $image = ImageTest::create([
            'filename' => 'test-image.jpg',
            'volume_id' => $volume->id,
        ]);
        $path = ImageCache::get($image, $this->noop);
        $this->assertEquals(base_path('tests').'/files/test-image.jpg', $path);
    }

    public function testGetDiskCloud()
    {
        config(['filesystems.disks.s3' => ['driver' => 's3']]);
        $volume = VolumeTest::create(['url' => 's3://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $stream = fopen(base_path('tests').'/files/test-image.jpg', 'r');

        $mock = Mockery::mock();
        $mock->shouldReceive('getDriver')->once()->andReturn($mock);
        $mock->shouldReceive('getAdapter')->once()->andReturn($mock);
        $mock->shouldReceive('readStream')->once()->andReturn($stream);
        Storage::shouldReceive('disk')->once()->with('s3')->andReturn($mock);

        $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
        $path = ImageCache::get($image, $this->noop);
        $this->assertEquals("{$this->cachePath}/{$image->id}", $path);
        $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
        $this->assertFalse(is_resource($stream));
    }

    public function testGetDiskCloudTooLarge()
    {
        config(['filesystems.disks.s3' => ['driver' => 's3']]);
        $volume = VolumeTest::create(['url' => 's3://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);
        config(['image.cache.max_image_size' => 1]);

        $stream = fopen(base_path('tests').'/files/test-image.jpg', 'r');

        $mock = Mockery::mock();
        $mock->shouldReceive('getDriver')->once()->andReturn($mock);
        $mock->shouldReceive('getAdapter')->once()->andReturn($mock);
        $mock->shouldReceive('readStream')->once()->andReturn($stream);
        Storage::shouldReceive('disk')->once()->with('s3')->andReturn($mock);

        $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('file is too large');
        $path = ImageCache::get($image, $this->noop);
    }

    public function testGetOnce()
    {
        $image = ImageTest::create();
        touch("{$this->cachePath}/{$image->id}");
        $this->assertTrue(File::exists("{$this->cachePath}/{$image->id}"));
        ImageCache::getOnce($image, $this->noop);
        $this->assertFalse(File::exists("{$this->cachePath}/{$image->id}"));
    }

    public function testGetStreamCached()
    {
        $image = ImageTest::create();

        $path = "{$this->cachePath}/{$image->id}";
        touch($path, time() - 1);

        $cache = new ImageCacheStub;
        $cache->stream = 'abc123';
        $this->assertNotEquals(time(), fileatime($path));
        $this->assertEquals('abc123', $cache->getStream($image));
        clearstatcache();
        $this->assertEquals(time(), fileatime($path));
    }

    public function testGetStreamRemote()
    {
        $volume = VolumeTest::create(['url' => 'https://files']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $cache = new ImageCacheStub;
        $cache->stream = 'abc123';
        $this->assertEquals('abc123', $cache->getStream($image));
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

        $stream = ImageCache::getStream($image);
        $this->assertTrue(is_resource($stream));
        fclose($stream);
    }

    public function testPrune()
    {
        File::put("{$this->cachePath}/abc", 'abc');
        touch("{$this->cachePath}/abc", time() - 1);
        File::put("{$this->cachePath}/def", 'def');
        config(['image.cache.max_size' => 3]);

        ImageCache::prune();
        $this->assertFalse(File::exists("{$this->cachePath}/abc"));
        $this->assertTrue(File::exists("{$this->cachePath}/def"));

        config(['image.cache.max_size' => 0]);
        ImageCache::prune();
        $this->assertFalse(File::exists("{$this->cachePath}/def"));
    }

    public function testFake()
    {
        ImageCache::fake();
        $image = ImageTest::create();
        $path = ImageCache::get($image, function ($image, $path) {
            return $path;
        });
        $this->assertFalse(File::exists($path));
    }

    public function testClear()
    {
        File::put("{$this->cachePath}/abc", 'abc');
        File::put("{$this->cachePath}/def", 'abc');
        $handle = fopen("{$this->cachePath}/def", 'r');
        flock($handle, LOCK_SH);
        ImageCache::clear();
        fclose($handle);
        $this->assertTrue(File::exists("{$this->cachePath}/def"));
        $this->assertFalse(File::exists("{$this->cachePath}/abc"));
    }
}

class ImageCacheStub extends \Biigle\Services\ImageCache
{
    const MAX_RETRIES = 1;
    public $stream = null;

    protected function getImageStream($url, $context = null)
    {
        if (is_null($this->stream)) {
            return parent::getImageStream($url, $context);
        }

        return $this->stream;
    }
}
