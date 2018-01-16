<?php

namespace Biigle\Tests\Jobs;

use Log;
use File;
use TestCase;
use VipsImage;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\ProcessThumbnailChunkJob;

class ProcessThumbnailChunkJobTest extends TestCase
{
    public function testHandle()
    {
        if (!function_exists('vips_call')) {
            $this->markTestSkipped('Requires the PHP vips extension.');
        }

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);

        with(new ProcessThumbnailChunkJob([$image]))->handle();

        $this->assertTrue(File::exists($image->thumbPath));
        $size = getimagesize($image->thumbPath);
        $config = [config('thumbnails.width'), config('thumbnails.height')];

        $this->assertTrue($size[0] <= $config[0]);
        $this->assertTrue($size[1] <= $config[1]);
        $this->assertTrue($size[0] == $config[0] || $size[1] == $config[1]);

        $this->cleanup($image);
    }

    public function testHandleNotReadable()
    {
        if (!function_exists('vips_call')) {
            $this->markTestSkipped('Requires the PHP vips extension.');
        }

        Log::shouldReceive('error')->once();
        $image = ImageTest::create(['filename' => 'does_not_exist']);
        with(new ProcessThumbnailChunkJob([$image]))->handle();
        $this->cleanup($image, false);
    }

    public function testSkipExisting()
    {
        VipsImage::shouldReceive('thumbnail')->never();
        $image = ImageTest::create(['filename' => 'random']);
        File::makeDirectory(File::dirname($image->thumbPath), 0755, true, true);
        touch($image->thumbPath);

        try {
            with(new ProcessThumbnailChunkJob([$image]))->handle();
        } finally {
            $this->cleanup($image);
        }
    }

    protected function cleanup($image, $exists = true)
    {
        $this->assertTrue(File::delete($image->thumbPath) === $exists);
        // These directories may contain other thumbnails from a development instance.
        @rmdir(dirname($image->thumbPath, 1));
        @rmdir(dirname($image->thumbPath, 2));
    }
}
