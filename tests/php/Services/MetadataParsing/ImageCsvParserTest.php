<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\MediaType;
use Biigle\Services\MetadataParsing\ImageCsvParser;
use Symfony\Component\HttpFoundation\File\File;
use TestCase;

class ImageCsvParserTest extends TestCase
{
    public function testRecognizesFile()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParser($file);
        $this->assertTrue($parser->recognizesFile());

        $file = new File(__DIR__."/../../../files/image-metadata-with-bom.csv");
        $parser = new ImageCsvParser($file);
        $this->assertTrue($parser->recognizesFile());

        $file = new File(__DIR__."/../../../files/test.mp4");
        $parser = new ImageCsvParser($file);
        $this->assertFalse($parser->recognizesFile());

        $file = new File(__DIR__."/../../../files/image-metadata-strange-encoding.csv");
        $parser = new ImageCsvParser($file);
        $this->assertFalse($parser->recognizesFile());
    }

    public function testGetMetadata()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParser($file);
        $data = $parser->getMetadata();
        $this->assertEquals(MediaType::imageId(), $data->type->id);
        $this->assertNull($data->name);
        $this->assertNull($data->url);
        $this->assertNull($data->handle);
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.jpg', $file->name);
        $this->assertEquals('2016-12-19 12:27:00', $file->takenAt);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertEquals(-1500, $file->gpsAltitude);
        $this->assertEquals(10, $file->distanceToGround);
        $this->assertEquals(2.6, $file->area);
        $this->assertEquals(180, $file->yaw);
    }

    public function testGetMetadataIgnoreMissingFilename()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParserStub($file);
        $parser->content = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(0, $data->getFiles());
    }

    public function testGetMetadataCantReadFile()
    {
        $file = new File(__DIR__."/../../../files/test.mp4");
        $parser = new ImageCsvParser($file);
        $data = $parser->getMetadata();
        $this->assertEquals(MediaType::imageId(), $data->type->id);
        $this->assertCount(0, $data->getFiles());
    }

    public function testGetMetadataCaseInsensitive()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParserStub($file);
        $parser->content = [
            ['Filename', 'tAken_at', 'lnG', 'Lat', 'gPs_altitude', 'diStance_to_ground', 'areA'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.jpg', $file->name);
        $this->assertEquals('2016-12-19 12:27:00', $file->takenAt);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertEquals(-1500, $file->gpsAltitude);
        $this->assertEquals(10, $file->distanceToGround);
        $this->assertEquals(2.6, $file->area);
    }

    public function testGetMetadataColumnSynonyms1()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParserStub($file);
        $parser->content = [
            ['file', 'lon', 'lat', 'heading'],
            ['abc.jpg', '52.220', '28.123', '180'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.jpg', $file->name);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertEquals(180, $file->yaw);
    }

    public function testGetMetadataColumnSynonyms2()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParserStub($file);
        $parser->content = [
            ['file', 'longitude', 'latitude'],
            ['abc.jpg', '52.220', '28.123'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.jpg', $file->name);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
    }

    public function testGetMetadataColumnSynonyms3()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParserStub($file);
        $parser->content = [
            ['file', 'SUB_datetime', 'SUB_longitude', 'SUB_latitude', 'SUB_altitude', 'SUB_distance', 'SUB_heading'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '180'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.jpg', $file->name);
        $this->assertEquals('2016-12-19 12:27:00', $file->takenAt);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertEquals(-1500, $file->gpsAltitude);
        $this->assertEquals(10, $file->distanceToGround);
        $this->assertEquals(180, $file->yaw);
    }

    public function testGetMetadataEmptyCells()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new ImageCsvParserStub($file);
        $parser->content = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '', '52.220', '28.123', '', '', '', ''],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.jpg', $file->name);
        $this->assertNull($file->takenAt);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertNull($file->gpsAltitude);
        $this->assertNull($file->distanceToGround);
        $this->assertNull($file->area);
        $this->assertNull($file->yaw);
    }
}

class ImageCsvParserStub extends ImageCsvParser
{
    public array $content = [];

    protected function getCsvIterator(): \SeekableIterator
    {
        return new \ArrayIterator($this->content);
    }
}
