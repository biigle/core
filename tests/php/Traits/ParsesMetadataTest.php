<?php

namespace Biigle\Tests\Traits;

use Biigle\Traits\ParsesMetadata;
use Exception;
use Illuminate\Http\UploadedFile;
use TestCase;

class ParsesMetadataTest extends TestCase
{
    public function testParseMetadataOk()
    {
        $stub = new ParsesMetadataStub;
        $input = "filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw\nabc.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataCaseInsensitive()
    {
        $stub = new ParsesMetadataStub;
        $input = "Filename,tAken_at,lnG,Lat,gPs_altitude,diStance_to_ground,areA\nabc.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataSynonyms1()
    {
        $stub = new ParsesMetadataStub;
        $input = "file,lon,lat,heading\nabc.jpg,52.220,28.123,180";
        $expect = [
            ['filename', 'lng', 'lat', 'yaw'],
            ['abc.jpg', '52.220', '28.123', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataSynonyms2()
    {
        $stub = new ParsesMetadataStub;
        $input = "file,longitude,latitude\nabc.jpg,52.220,28.123";
        $expect = [
            ['filename', 'lng', 'lat'],
            ['abc.jpg', '52.220', '28.123'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataSynonyms3()
    {
        $stub = new ParsesMetadataStub;
        $input = "filename,SUB_datetime,SUB_longitude,SUB_latitude,SUB_altitude,SUB_distance,area,SUB_heading\nabc.jpg,2016-12-19 12:27:00,52.220,28.123,-1500,10,2.6,180";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataEmptyCells()
    {
        $stub = new ParsesMetadataStub;
        $input = "filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area,yaw\nabc.jpg,,52.220,28.123,,,,";
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '', '52.220', '28.123', '', '', '', ''],
        ];
        $this->assertEquals($expect, $stub->parseMetadata($input));
    }

    public function testParseMetadataFile()
    {
        $stub = new ParsesMetadataStub;
        $csv = __DIR__."/../../files/image-metadata.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadataFile($file));
    }

    public function testParseMetadataFileBOM()
    {
        $stub = new ParsesMetadataStub;
        $csv = __DIR__."/../../files/image-metadata-with-bom.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);
        $expect = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertEquals($expect, $stub->parseMetadataFile($file));
    }

    public function testParseIfdo()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
image-set-items:
    myimage.jpg:
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename'],
                ['myimage.jpg'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoHeader()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
    image-set-data-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450@data
    image-set-acquisition: photo
    image-latitude: 11.8581802
    image-longitude: -117.0214864
    image-meters-above-ground: 2
    image-area-square-meter: 5.0
    image-datetime: '2019-04-06 04:29:27.000000'
    image-depth: 2248.0
    image-camera-yaw-degrees: 20
image-set-items:
    myimage.jpg:
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => 'https://hdl.handle.net/20.500.12085/d7546c4b-307f-4d42-8554-33236c577450@data',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename', 'area', 'distance_to_ground', 'gps_altitude', 'lat', 'lng', 'taken_at', 'yaw'],
                ['myimage.jpg', '5.0', '2', '-2248.0', '11.8581802', '-117.0214864', '2019-04-06 04:29:27.000000', '20'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoVideoType()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
    image-acquisition: video
image-set-items:
    myvideo.mp4:
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'video',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename'],
                ['myvideo.mp4'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoSlideIsImageType()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
    image-set-acquisition: slide
image-set-items:
    myimage.jpg:
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename'],
                ['myimage.jpg'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoItems()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
image-set-items:
    myimage.jpg:
        image-latitude: 11.8581802
        image-longitude: -117.0214864
        image-meters-above-ground: 2
        image-area-square-meter: 5.0
        image-datetime: '2019-04-06 04:29:27.000000'
        image-depth: 2248.0
        image-camera-yaw-degrees: 20
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename', 'area', 'distance_to_ground', 'gps_altitude', 'lat', 'lng', 'taken_at', 'yaw'],
                ['myimage.jpg', '5.0', '2', '-2248.0', '11.8581802', '-117.0214864', '2019-04-06 04:29:27.000000', '20'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoImageArrayItems()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
image-set-items:
    myimage.jpg:
        - image-latitude: 11.8581802
          image-longitude: -117.0214864
          image-meters-above-ground: 2
          image-area-square-meter: 5.0
          image-datetime: '2019-04-06 04:29:27.000000'
          image-depth: 2248.0
          image-camera-yaw-degrees: 20
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename', 'area', 'distance_to_ground', 'gps_altitude', 'lat', 'lng', 'taken_at', 'yaw'],
                ['myimage.jpg', '5.0', '2', '-2248.0', '11.8581802', '-117.0214864', '2019-04-06 04:29:27.000000', '20'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoItemsOverrideHeader()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
    image-latitude: 11.8581802
    image-longitude: -117.0214864
    image-meters-above-ground: 2
    image-area-square-meter: 5.0
    image-datetime: '2019-04-06 04:29:27.000000'
    image-depth: 2248.0
    image-camera-yaw-degrees: 20
image-set-items:
    myimage.jpg:
        image-meters-above-ground: 3
        image-area-square-meter: 5.1
        image-datetime: '2019-04-06 05:29:27.000000'
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename', 'area', 'distance_to_ground', 'gps_altitude', 'lat', 'lng', 'taken_at', 'yaw'],
                ['myimage.jpg', '5.1', '3', '-2248.0', '11.8581802', '-117.0214864', '2019-04-06 05:29:27.000000', '20'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoSubItemsOverrideDefaultsAndHeader()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
    image-latitude: 11.8581802
    image-longitude: -117.0214864
    image-meters-above-ground: 2
    image-area-square-meter: 5.0
    image-datetime: '2019-04-06 04:29:27.000000'
    image-depth: 2248.0
    image-camera-yaw-degrees: 20
    image-acquisition: video
image-set-items:
    myvideo.mp4:
        - image-meters-above-ground: 3
          image-area-square-meter: 5.1
          image-datetime: '2019-04-06 05:29:27.000000'
        - image-meters-above-ground: 4
          image-datetime: '2019-04-06 05:30:27.000000'
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'video',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename', 'area', 'distance_to_ground', 'gps_altitude', 'lat', 'lng', 'taken_at', 'yaw'],
                ['myvideo.mp4', '5.1', '3', '-2248.0', '11.8581802', '-117.0214864', '2019-04-06 05:29:27.000000', '20'],
                ['myvideo.mp4', '5.1', '4', '-2248.0', '11.8581802', '-117.0214864', '2019-04-06 05:30:27.000000', '20'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoFile()
    {
        $stub = new ParsesMetadataStub;
        $path = __DIR__."/../../files/image-ifdo.yaml";
        $file = new UploadedFile($path, 'ifdo.yaml', 'application/yaml', null, true);
        $expect = [
            'name' => 'SO268 SO268-2_100-1_OFOS SO_CAM-1_Photo_OFOS',
            'url' => 'https://hdl.handle.net/20.500.12085/d7546c4b-307f-4d42-8554-33236c577450@data',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [
                ['filename', 'area', 'distance_to_ground', 'gps_altitude', 'lat', 'lng', 'taken_at', 'yaw'],
                ['SO268-2_100-1_OFOS_SO_CAM-1_20190406_042927.JPG', '5.0', '2', '-2248.0', '11.8581802', '-117.0214864', '2019-04-06 04:29:27.000000', '20'],
                ['SO268-2_100-1_OFOS_SO_CAM-1_20190406_052726.JPG', '5.1', '2.1', '-4129.6', '11.8582192', '-117.0214286', '2019-04-06 05:27:26.000000', '21'],
            ],
        ];
        $this->assertEquals($expect, $stub->parseIfdoFile($file));
    }

    public function testParseIfdoNoHeader()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-items:
    myimage.jpg:
IFDO;

        $this->expectException(Exception::class);
        $stub->parseIfdo($input);
    }

    public function testParseIfdoNoItems()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
IFDO;
        $expect = [
            'name' => 'myvolume',
            'url' => '',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'files' => [],
        ];
        $this->assertEquals($expect, $stub->parseIfdo($input));
    }

    public function testParseIfdoNoName()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
IFDO;

        $this->expectException(Exception::class);
        $stub->parseIfdo($input);
    }

    public function testParseIfdoNoHandle()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
IFDO;

        $this->expectException(Exception::class);
        $stub->parseIfdo($input);
    }

    public function testParseIfdoNoUuid()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
IFDO;

        $this->expectException(Exception::class);
        $stub->parseIfdo($input);
    }

    public function testParseIfdoInvalidHandle()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: abc
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
IFDO;

        $this->expectException(Exception::class);
        $stub->parseIfdo($input);
    }

    public function testParseIfdoInvalidDataHandle()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:
    image-set-name: myvolume
    image-set-handle: 20.500.12085/d7546c4b-307f-4d42-8554-33236c577450
    image-set-uuid: d7546c4b-307f-4d42-8554-33236c577450
    image-set-data-handle: abc
IFDO;

        $this->expectException(Exception::class);
        $stub->parseIfdo($input);
    }

    public function testParseIfdoInvalidYaml()
    {
        $stub = new ParsesMetadataStub;
        $input = <<<IFDO
image-set-header:!!
IFDO;

        $this->expectException(Exception::class);
        $stub->parseIfdo($input);
    }

    public function testParseIfdoNoYamlArray()
    {
        $stub = new ParsesMetadataStub;
        $this->expectException(Exception::class);
        $stub->parseIfdo('abc123');
    }
}

class ParsesMetadataStub
{
    use ParsesMetadata;
}
