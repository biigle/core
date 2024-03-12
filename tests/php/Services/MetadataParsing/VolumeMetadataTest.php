<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\MediaType;
use Biigle\Services\MetadataParsing\FileMetadata;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use TestCase;

class VolumeMetadataTest extends TestCase
{
    public function testNew()
    {
        $metadata = new VolumeMetadata(MediaType::image(), 'volumename', 'volumeurl', 'volumehandle');

        $this->assertEquals(MediaType::imageId(), $metadata->type->id);
        $this->assertEquals('volumename', $metadata->name);
        $this->assertEquals('volumeurl', $metadata->url);
        $this->assertEquals('volumehandle', $metadata->handle);
    }

    public function testAddGetFiles()
    {
        $metadata = new VolumeMetadata();
        $file = new FileMetadata('filename');
        $metadata->addFile($file);
        $this->assertEquals($file, $metadata->getFiles()[0]);
        $metadata->addFile($file);
        $this->assertCount(1, $metadata->getFiles());
    }

    public function testGetFile()
    {
        $metadata = new VolumeMetadata();
        $this->assertNull($metadata->getFile('filename'));
        $file = new FileMetadata('filename');
        $metadata->addFile($file);
        $this->assertEquals($file, $metadata->getFile('filename'));
    }

    public function testIsEmpty()
    {
        $metadata = new VolumeMetadata();
        $this->assertTrue($metadata->isEmpty());
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $this->assertTrue($metadata->isEmpty());
        $file = new ImageMetadata('filename', area: 100);
        $metadata->addFile($file);
        $this->assertFalse($metadata->isEmpty());
    }
}
