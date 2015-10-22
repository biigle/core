<?php

class ServicesThumbnailsInterventionImageTest extends TestCase
{
    public function testGenerateThumbnails()
    {
        $service = app()->make('Dias\Contracts\ThumbnailService');
        $transect = TransectTest::create();
        $image = ImageTest::create();
        $transect->images()->save($image);
        File::delete($image->thumbPath);

        $service->generateThumbnails($transect);

        $this->assertTrue(File::exists($image->thumbPath));
        $size = getimagesize($image->thumbPath);
        $config = [config('thumbnails.width'), config('thumbnails.height')];

        $this->assertTrue($size[0] <= $config[0]);
        $this->assertTrue($size[1] <= $config[1]);
        $this->assertTrue($size[0] == $config[0] || $size[1] == $config[1]);
    }
}
