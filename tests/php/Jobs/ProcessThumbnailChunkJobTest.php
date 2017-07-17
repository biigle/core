<?php

namespace Biigle\Tests\Jobs;

use Log;
use File;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use InterventionImage as IImage;
use Biigle\Jobs\ProcessThumbnailChunkJob;

class ProcessThumbnailChunkJobTest extends TestCase
{
    public function testHandle()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);
        File::delete($image->thumbPath);

        with(new ProcessThumbnailChunkJob([$image]))->handle();

        $this->assertTrue(File::exists($image->thumbPath));
        $size = getimagesize($image->thumbPath);
        $config = [config('thumbnails.width'), config('thumbnails.height')];

        $this->assertTrue($size[0] <= $config[0]);
        $this->assertTrue($size[1] <= $config[1]);
        $this->assertTrue($size[0] == $config[0] || $size[1] == $config[1]);

        File::delete($image->thumbPath);
    }

    public function testHandleNotReadable()
    {
        Log::shouldReceive('error')->once();
        $image = ImageTest::create(['filename' => 'does_not_exist']);
        with(new ProcessThumbnailChunkJob([$image]))->handle();
    }

    public function testSkipExisting()
    {
        // This actually doesn't work and IImake::make() will throw an error afterwards.
        // But we want to test that make() isn't called anyway so if an error is thrown
        // this test fails as expected.
        IImage::shouldReceive('make')->never();

        $image = ImageTest::create(['filename' => 'random']);
        touch($image->thumbPath);
        try {
            with(new ProcessThumbnailChunkJob([$image]))->handle();
        } finally {
            File::delete($image->thumbPath);
        }
    }
}
