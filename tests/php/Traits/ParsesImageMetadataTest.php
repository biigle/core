<?php

namespace Biigle\Tests\Traits;

use Biigle\Traits\ParsesImageMetadata;
use Illuminate\Http\UploadedFile;
use TestCase;

class ParsesImageMetadataTest extends TestCase
{
    public function testParseMetadataOk()
    {
        $stub = new ParsesImageMetadataStub;
        $input = "filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw\nabc.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataCaseInsensitive()
    {
        $stub = new ParsesImageMetadataStub;
        $input = "Filename,tAken_at,lnG,Lat,gPs_altitude,diStance_to_ground,areA\nabc.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataSynonyms1()
    {
        $stub = new ParsesImageMetadataStub;
        $input = "file,lon,lat,heading\nabc.jpg,52.220,28.123,180";
        $expect = [
            ['filename', 'lng', 'lat', 'yaw'],
            ['abc.jpg', '52.220', '28.123', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataSynonyms2()
    {
        $stub = new ParsesImageMetadataStub;
        $input = "file,longitude,latitude\nabc.jpg,52.220,28.123";
        $expect = [
            ['filename', 'lng', 'lat'],
            ['abc.jpg', '52.220', '28.123'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataSynonyms3()
    {
        $stub = new ParsesImageMetadataStub;
        $input = "filename,SUB_datetime,SUB_longitude,SUB_latitude,SUB_altitude,SUB_distance,area,SUB_heading\nabc.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataEmptyCells()
    {
        $stub = new ParsesImageMetadataStub;
        $input = "filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw\nabc.jpg,,52.220,28.123,,,,";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '', '52.220', '28.123', '', '', '', ''],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataFile()
    {
        $stub = new ParsesImageMetadataStub;
        $csv = __DIR__."/../../files/image-metadata.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, null, true);
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadataFile($file));
    }

    public function testParseMetadataFileBOM()
    {
        $stub = new ParsesImageMetadataStub;
        $csv = __DIR__."/../../files/image-metadata-with-bom.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, null, true);
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadataFile($file));
    }
}

class ParsesImageMetadataStub
{
    use ParsesImageMetadata;
}
