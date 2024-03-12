<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\MediaType;
use Biigle\Services\MetadataParsing\VideoCsvParser;
use Symfony\Component\HttpFoundation\File\File;
use TestCase;

class VideoCsvParserTest extends TestCase
{
    public function testRecognizesFile()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParser($file);
        $this->assertTrue($parser->recognizesFile());

        $file = new File(__DIR__."/../../../files/test.mp4");
        $parser = new VideoCsvParser($file);
        $this->assertFalse($parser->recognizesFile());

        $file = new File(__DIR__."/../../../files/video-metadata-strange-encoding.csv");
        $parser = new VideoCsvParser($file);
        $this->assertFalse($parser->recognizesFile());
    }

    public function testGetMetadata()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParser($file);
        $data = $parser->getMetadata();
        $this->assertEquals(MediaType::videoId(), $data->type->id);
        $this->assertNull($data->name);
        $this->assertNull($data->url);
        $this->assertNull($data->handle);
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.mp4', $file->name);
        $this->assertEquals('2016-12-19 12:27:00', $file->takenAt);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertEquals(-1500, $file->gpsAltitude);
        $this->assertEquals(10, $file->distanceToGround);
        $this->assertEquals(2.6, $file->area);
        $this->assertEquals(180, $file->yaw);

        $frames = $file->getFrames();
        $this->assertCount(2, $frames);
        $frame = $frames[0];
        $this->assertEquals('abc.mp4', $frame->name);
        $this->assertEquals('2016-12-19 12:27:00', $frame->takenAt);
        $this->assertEquals(52.220, $frame->lng);
        $this->assertEquals(28.123, $frame->lat);
        $this->assertEquals(-1500, $frame->gpsAltitude);
        $this->assertEquals(10, $frame->distanceToGround);
        $this->assertEquals(2.6, $frame->area);
        $this->assertEquals(180, $frame->yaw);

        $frame = $frames[1];
        $this->assertEquals('abc.mp4', $frame->name);
        $this->assertEquals('2016-12-19 12:28:00', $frame->takenAt);
        $this->assertEquals(52.230, $frame->lng);
        $this->assertEquals(28.133, $frame->lat);
        $this->assertEquals(-1505, $frame->gpsAltitude);
        $this->assertEquals(5, $frame->distanceToGround);
        $this->assertEquals(1.6, $frame->area);
        $this->assertEquals(181, $frame->yaw);
    }

    public function testGetMetadataIgnoreMissingFilename()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParserStub($file);
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
        $parser = new VideoCsvParser($file);
        $data = $parser->getMetadata();
        $this->assertEquals(MediaType::videoId(), $data->type->id);
        $this->assertCount(0, $data->getFiles());
    }

    public function testGetMetadataCaseInsensitive()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParserStub($file);
        $parser->content = [
            ['Filename', 'tAken_at', 'lnG', 'Lat', 'gPs_altitude', 'diStance_to_ground', 'areA'],
            ['abc.mp4', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.mp4', $file->name);
        $frame = $file->getFrames()->first();
        $this->assertEquals('2016-12-19 12:27:00', $frame->takenAt);
        $this->assertEquals(52.220, $frame->lng);
        $this->assertEquals(28.123, $frame->lat);
        $this->assertEquals(-1500, $frame->gpsAltitude);
        $this->assertEquals(10, $frame->distanceToGround);
        $this->assertEquals(2.6, $frame->area);
    }

    public function testGetMetadataColumnSynonyms1()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParserStub($file);
        $parser->content = [
            ['file', 'lon', 'lat', 'heading'],
            ['abc.mp4', '52.220', '28.123', '180'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.mp4', $file->name);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertEquals(180, $file->yaw);
        $this->assertTrue($file->getFrames()->isEmpty());
    }

    public function testGetMetadataColumnSynonyms2()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParserStub($file);
        $parser->content = [
            ['file', 'longitude', 'latitude'],
            ['abc.mp4', '52.220', '28.123'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.mp4', $file->name);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertTrue($file->getFrames()->isEmpty());
    }

    public function testGetMetadataColumnSynonyms3()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParserStub($file);
        $parser->content = [
            ['file', 'SUB_datetime', 'SUB_longitude', 'SUB_latitude', 'SUB_altitude', 'SUB_distance', 'SUB_heading'],
            ['abc.mp4', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '180'],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.mp4', $file->name);
        $frame = $file->getFrames()->first();
        $this->assertEquals('2016-12-19 12:27:00', $frame->takenAt);
        $this->assertEquals(52.220, $frame->lng);
        $this->assertEquals(28.123, $frame->lat);
        $this->assertEquals(-1500, $frame->gpsAltitude);
        $this->assertEquals(10, $frame->distanceToGround);
        $this->assertEquals(180, $frame->yaw);
    }

    public function testGetMetadataEmptyCells()
    {
        $file = new File(__DIR__."/../../../files/video-metadata.csv");
        $parser = new VideoCsvParserStub($file);
        $parser->content = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.mp4', '', '52.220', '28.123', '', '', '', ''],
        ];

        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $file = $data->getFiles()->first();
        $this->assertEquals('abc.mp4', $file->name);
        $this->assertNull($file->takenAt);
        $this->assertEquals(52.220, $file->lng);
        $this->assertEquals(28.123, $file->lat);
        $this->assertNull($file->gpsAltitude);
        $this->assertNull($file->distanceToGround);
        $this->assertNull($file->area);
        $this->assertNull($file->yaw);
        $this->assertTrue($file->getFrames()->isEmpty());
    }

    public function testGetMetadataStrangeEncoding()
    {
        $file = new File(__DIR__."/../../../files/video-metadata-strange-encoding.csv");
        $parser = new VideoCsvParser($file);
        $data = $parser->getMetadata();
        $this->assertCount(1, $data->getFiles());
        $this->assertCount(0, $data->getFiles()->first()->getFrames());
    }
}

class VideoCsvParserStub extends VideoCsvParser
{
    public array $content = [];

    protected function getCsvIterator(): \SeekableIterator
    {
        return new \ArrayIterator($this->content);
    }
}
