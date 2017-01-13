<?php

namespace Biigle\Tests\Services\Thumbnails;

use File;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
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

        with(new InterventionImage)->generateThumbnails($volume, [$image1->id]);

        $this->assertTrue(File::exists($image1->thumbPath));
        $this->assertFalse(File::exists($image2->thumbPath));

        File::delete($image1->thumbPath);
        File::delete($image2->thumbPath);
    }
}
