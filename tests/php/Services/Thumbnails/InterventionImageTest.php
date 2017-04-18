<?php

namespace Biigle\Tests\Services\Thumbnails;

use Log;
use File;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use InterventionImage as IImage;
use Biigle\Services\Thumbnails\InterventionImage;

class InterventionImageTest extends TestCase
{
    public function testGenerateThumbnails()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create();
        $volume->images()->save($image);
        File::delete($image->thumbPath);

        with(new InterventionImage)->generateThumbnails($volume, []);

        $this->assertTrue(File::exists($image->thumbPath));
        $size = getimagesize($image->thumbPath);
        $config = [config('thumbnails.width'), config('thumbnails.height')];

        $this->assertTrue($size[0] <= $config[0]);
        $this->assertTrue($size[1] <= $config[1]);
        $this->assertTrue($size[0] == $config[0] || $size[1] == $config[1]);

        File::delete($image->thumbPath);
    }

    public function testGenerateThumbnailsWithOnly()
    {
        $volume = VolumeTest::create();
        $image1 = ImageTest::create(['volume_id' => $volume->id]);
        $image2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'random']);
        File::delete($image1->thumbPath);
        File::delete($image2->thumbPath);

        try {
            with(new InterventionImage)->generateThumbnails($volume, [$image1->id]);

            $this->assertTrue(File::exists($image1->thumbPath));
            $this->assertFalse(File::exists($image2->thumbPath));
        } finally {
            File::delete($image1->thumbPath);
            File::delete($image2->thumbPath);
        }
    }

    public function testNotReadable()
    {
        Log::shouldReceive('error')->once();
        $image = ImageTest::create(['filename' => 'does_not_exist']);
        with(new InterventionImage)->generateThumbnails($image->volume, [$image->id]);
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
            with(new InterventionImage)->generateThumbnails($image->volume, [$image->id]);
        } finally {
            File::delete($image->thumbPath);
        }
    }
}
