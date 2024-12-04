<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageCsvParser;
use Biigle\Services\MetadataParsing\MetadataParser;
use Biigle\Services\MetadataParsing\ParserFactory;
use Biigle\Services\MetadataParsing\VideoCsvParser;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use TestCase;

class ParserFactoryTest extends TestCase
{
    public function testHasImage()
    {
        $this->assertTrue(ParserFactory::has('image', ImageCsvParser::class));
    }

    public function testHasVideo()
    {
        $this->assertTrue(ParserFactory::has('video', VideoCsvParser::class));
    }

    public function testHasUnknownType()
    {
        $this->assertFalse(ParserFactory::has('unknown', ImageCsvParser::class));
    }

    public function testHasUnknownParser()
    {
        $this->assertFalse(ParserFactory::has('image', 'unknown'));
    }

    public function testExtend()
    {
        ParserFactory::extend(TestParser::class, 'image');
        $this->assertContains(TestParser::class, ParserFactory::$parsers['image']);

        $this->expectException(\Exception::class);
        ParserFactory::extend(TestParser2::class, 'image');
    }
}

class TestParser extends MetadataParser
{
    public static function getKnownMimeTypes(): array
    {
        return [];
    }

    public static function getName(): string
    {
        return 'Test';
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
