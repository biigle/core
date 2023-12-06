<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\MediaType;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Services\MetadataParsing\FileMetadata;
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
}
