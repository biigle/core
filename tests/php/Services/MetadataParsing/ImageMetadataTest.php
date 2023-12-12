<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageMetadata;
use TestCase;

class ImageMetadataTest extends TestCase
{
    public function testIsEmpty()
    {
        $data = new ImageMetadata('filename');
        $this->assertTrue($data->isEmpty());

        $data = new ImageMetadata('filename', area: 10);
        $this->assertFalse($data->isEmpty());
    }
}
