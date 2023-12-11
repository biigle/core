<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageCsvParser;
use Biigle\Services\MetadataParsing\ParserFactory;
use Symfony\Component\HttpFoundation\File\File;
use TestCase;

class ParserFactoryTest extends TestCase
{
    public function testGetParserForFile()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = ParserFactory::getParserForFile($file);
        $this->assertInstanceOf(ImageCsvParser::class, $parser);
    }

    public function testGetParserForFileUnknown()
    {
        $file = new File(__DIR__."/../../../files/test.mp4");
        $parser = ParserFactory::getParserForFile($file);
        $this->assertNull($parser);
    }
}
