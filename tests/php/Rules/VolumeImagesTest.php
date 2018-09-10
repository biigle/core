<?php

namespace Biigle\Tests\Rules;

use TestCase;
use Biigle\Rules\VolumeImages;

class VolumeImagesTest extends TestCase
{
    public function testFormatOk()
    {
        $validator = new VolumeImages;
        $this->assertTrue($validator->passes(null, ['1.jpg', '2.jpeg', '1.JPG', '2.JPEG']));
        $this->assertTrue($validator->passes(null, ['1.png', '2.PNG']));
        $this->assertTrue($validator->passes(null, ['1.tif', '2.tiff', '2.TIF', '3.TIFF']));
    }

    public function testFormatNotOk()
    {
        $validator = new VolumeImages;
        $this->assertFalse($validator->passes(null, ['1.jpg', '2.bmp']));
        $this->assertContains('Only JPEG, PNG or TIFF', $validator->message());
    }

    public function testDupes()
    {
        $validator = new VolumeImages;
        $this->assertFalse($validator->passes(null, ['1.jpg', '1.jpg']));
        $this->assertContains('must not have the same image twice', $validator->message());
    }

    public function testEmpty()
    {
        $validator = new VolumeImages;
        $this->assertFalse($validator->passes(null, []));
        $this->assertContains('No images', $validator->message());
    }
}
