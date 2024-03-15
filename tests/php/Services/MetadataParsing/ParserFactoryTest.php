<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageCsvParser;
use Biigle\Services\MetadataParsing\MetadataParser;
use Biigle\Services\MetadataParsing\ParserFactory;
use Biigle\Services\MetadataParsing\VideoCsvParser;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Symfony\Component\HttpFoundation\File\File;
use TestCase;

class ParserFactoryTest extends TestCase
{
    public function testGetParserForFileImage()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = ParserFactory::getParserForFile($file, 'image');
        $this->assertInstanceOf(ImageCsvParser::class, $parser);
    }

    public function testGetParserForFileVideo()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = ParserFactory::getParserForFile($file, 'video');
        $this->assertInstanceOf(VideoCsvParser::class, $parser);
    }

    public function testGetParserForFileUnknownFile()
    {
        $file = new File(__DIR__."/../../../files/test.mp4");
        $parser = ParserFactory::getParserForFile($file, 'video');
        $this->assertNull($parser);
    }

    public function testGetParserForFileUnknownType()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = ParserFactory::getParserForFile($file, 'test');
        $this->assertNull($parser);
    }

    public function testExtend()
    {
        ParserFactory::extend(TestParser::class, 'image');
        $this->assertContains(TestParser::class, ParserFactory::$parsers['image']);

        $this->expectException(\Exception::class);
        ParserFactory::extend(TestParser2::class, 'image');
    }

    public function testGetKnownMimeTypes()
    {
        $types = ParserFactory::getKnownMimeTypes('image');
        $this->assertContains('text/csv', $types);
        $types = ParserFactory::getKnownMimeTypes('video');
        $this->assertContains('text/csv', $types);
        $types = ParserFactory::getKnownMimeTypes('unknown');
        $this->assertEquals([], $types);
    }
}

class TestParser extends MetadataParser
{
    public static function getKnownMimeTypes(): array
    {
        return [];
    }

    public function recognizesFile(): bool
    {
        return false;
    }

    public function getMetadata(): VolumeMetadata
    {
        return new VolumeMetadata;
    }
}

class TestParser2
{
    //
}
