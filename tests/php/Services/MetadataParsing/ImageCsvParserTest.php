<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\CsvParser;
use Biigle\Volume;
use Symfony\Component\HttpFoundation\File\File;
use TestCase;

class ImageCsvParserTest extends TestCase
{
    public function testRecognizesFile()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new CsvParser($file);
        $this->assertTrue($parser->recognizesFile());

        $file = new File(__DIR__."/../../../files/image-metadata-with-bom.csv");
        $parser = new CsvParser($file);
        $this->assertTrue($parser->recognizesFile());

        $file = new File(__DIR__."/../../../files/test.mp4");
        $parser = new CsvParser($file);
        $this->assertFalse($parser->recognizesFile());
    }

    public function testGetMetadata()
    {
        //
    }

    public function testGetMetadataIgnoreMissingFilename()
    {
        //
    }

    public function testGetMetadataCantReadFile()
    {
        //
    }
}
