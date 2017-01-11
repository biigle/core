<?php

namespace Biigle\Tests\Services\Thumbnails;

use File;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\TransectTest;
use Biigle\Services\Thumbnails\InterventionImage;

class InterventionImageTest extends TestCase
{
    public function testGenerateThumbnails()
    {
        $transect = TransectTest::create();
        $image = ImageTest::create();
        $transect->images()->save($image);
        File::delete($image->thumbPath);

        with(new InterventionImage)->generateThumbnails($transect, []);

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
        $transect = TransectTest::create();
        $image1 = ImageTest::create(['transect_id' => $transect->id]);
        $image2 = ImageTest::create(['transect_id' => $transect->id, 'filename' => 'random']);
        File::delete($image1->thumbPath);
        File::delete($image2->thumbPath);

        with(new InterventionImage)->generateThumbnails($transect, [$image1->id]);

        $this->assertTrue(File::exists($image1->thumbPath));
        $this->assertFalse(File::exists($image2->thumbPath));

        File::delete($image1->thumbPath);
        File::delete($image2->thumbPath);
    }
}
