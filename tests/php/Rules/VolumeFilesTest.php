<?php

namespace Biigle\Tests\Rules;

use Biigle\MediaType;
use Biigle\Rules\VolumeFiles;
use Storage;
use TestCase;

class VolumeFilesTest extends TestCase
{
    public function testImageFormatOk()
    {
        $validator = new VolumeFilesStub('', MediaType::imageId());
        $this->assertTrue($validator->passes(null, ['1.jpg', '2.jpeg', '1.JPG', '2.JPEG']));
        $this->assertTrue($validator->passes(null, ['1.png', '2.PNG']));
        $this->assertTrue($validator->passes(null, ['1.tif', '2.tiff', '2.TIF', '3.TIFF']));
        $this->assertTrue($validator->passes(null, ['1.webp', '2.WEBP']));
    }

    public function testImageFormatNotOk()
    {
        $validator = new VolumeFilesStub('', MediaType::imageId());
        $this->assertFalse($validator->passes(null, ['1.jpg', '2.bmp']));
        $this->assertStringContainsString('Only JPEG, PNG, WebP or TIFF', $validator->message());
    }

    public function testVideoFormatOk()
    {
        $validator = new VolumeFilesStub('', MediaType::videoId());
        $this->assertTrue($validator->passes(null, ['1.mp4', '1.MP4']));
        $this->assertTrue($validator->passes(null, ['1.mpeg', '2.MPEG']));
        $this->assertTrue($validator->passes(null, ['1.webm', '2.WEBM']));
    }

    public function testVideoFormatNotOk()
    {
        $validator = new VolumeFilesStub('', MediaType::videoId());
        $this->assertFalse($validator->passes(null, ['1.mp4', '2.avi']));
        $this->assertStringContainsString('Only MPEG, MP4 or WebM', $validator->message());
    }

    public function testDupes()
    {
        $validator = new VolumeFilesStub('', MediaType::imageId());
        $this->assertFalse($validator->passes(null, ['1.jpg', '1.jpg']));
        $this->assertStringContainsString('must not have the same file twice', $validator->message());
    }

    public function testEmpty()
    {
        $validator = new VolumeFilesStub('', MediaType::imageId());
        $this->assertFalse($validator->passes(null, []));
        $this->assertStringContainsString('No files', $validator->message());
    }

    public function testAllowQueryParams()
    {
        $validator = new VolumeFilesStub('', MediaType::imageId());
        $this->assertTrue($validator->passes(null, ['1.jpg?raw=1']));
    }

    public function testCheckImageFilesExist()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $validator = new VolumeFiles('test://images', MediaType::imageId());
        $this->assertFalse($validator->passes(null, ['1.jpg', '2.jpg']));
        Storage::disk('test')->put('images/2.jpg', 'abc');
        $this->assertTrue($validator->passes(null, ['1.jpg', '2.jpg']));
    }

    public function testCheckVideoFilesExist()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');
        $validator = new VolumeFiles('test://videos', MediaType::videoId());
        $this->assertFalse($validator->passes(null, ['1.mp4', '2.mp4']));
        Storage::disk('test')->put('videos/2.mp4', 'abc');
        $this->assertTrue($validator->passes(null, ['1.mp4', '2.mp4']));
    }
}

class VolumeFilesStub extends VolumeFiles
{
    protected function sampleFilesExist($files)
    {
        return true;
    }
}
