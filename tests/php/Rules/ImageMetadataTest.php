<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\ImageMetadata;
use TestCase;

class ImageMetadataTest extends TestCase
{
    public function testMetadataOk()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'taken_at', 'lng', 'lat', 'gps_altitude', 'distance_to_ground', 'area', 'yaw'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123', '-1500', '10', '2.6', '180'],
        ];
        $this->assertTrue($validator->passes(null, $metadata));
    }

    public function testMetadataWrongFile()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'taken_at'],
            ['cba.jpg', '2016-12-19 12:27:00'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataNoCols()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['abc.jpg', '2016-12-19 12:27:00'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataWrongCols()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'abc'],
            ['abc.jpg', '2016-12-19 12:27:00'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataColCount()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'taken_at'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataNoLat()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'lng'],
            ['abc.jpg', '52.220'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataNoLng()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'lat'],
            ['abc.jpg', '28.123'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataColOrdering()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'lng', 'lat', 'taken_at'],
            ['abc.jpg', '2016-12-19 12:27:00', '52.220', '28.123'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLat()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'lng', 'lat'],
            ['abc.jpg', '50', '91'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLng()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'lng', 'lat'],
            ['abc.jpg', '181', '50'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidYaw()
    {
        $validator = new ImageMetadata(['abc.jpg']);
        $metadata = [
            ['filename', 'yaw'],
            ['abc.jpg', '361'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }
}
