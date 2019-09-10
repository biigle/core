<?php

namespace Biigle\Tests\Rules;

use Storage;
use TestCase;
use Biigle\Rules\VolumeImages;

class VolumeImagesTest extends TestCase
{
    public function testFormatOk()
    {
        $validator = new VolumeImagesStub('');
        $this->assertTrue($validator->passes(null, ['1.jpg', '2.jpeg', '1.JPG', '2.JPEG']));
        $this->assertTrue($validator->passes(null, ['1.png', '2.PNG']));
        $this->assertTrue($validator->passes(null, ['1.tif', '2.tiff', '2.TIF', '3.TIFF']));
    }

    public function testFormatNotOk()
    {
        $validator = new VolumeImagesStub('');
        $this->assertFalse($validator->passes(null, ['1.jpg', '2.bmp']));
        $this->assertContains('Only JPEG, PNG or TIFF', $validator->message());
    }

    public function testDupes()
    {
        $validator = new VolumeImagesStub('');
        $this->assertFalse($validator->passes(null, ['1.jpg', '1.jpg']));
        $this->assertContains('must not have the same image twice', $validator->message());
    }

    public function testEmpty()
    {
        $validator = new VolumeImagesStub('');
        $this->assertFalse($validator->passes(null, []));
        $this->assertContains('No images', $validator->message());
    }

    public function testAllowQueryParams()
    {
        $validator = new VolumeImagesStub('');
        $this->assertTrue($validator->passes(null, ['1.jpg?raw=1']));
    }

    public function testCheckFilesExist()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $validator = new VolumeImages('test://images');
        $this->assertFalse($validator->passes(null, ['1.jpg', '2.jpg']));
        Storage::disk('test')->put('images/2.jpg', 'abc');
        $this->assertTrue($validator->passes(null, ['1.jpg', '2.jpg']));
    }
}

class VolumeImagesStub extends VolumeImages
{
    protected function sampleImagesExist($images)
    {
        return true;
    }
}
