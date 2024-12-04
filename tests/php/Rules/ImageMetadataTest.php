<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\ImageMetadata as ImageMetadataRule;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use TestCase;

class ImageMetadataTest extends TestCase
{
    public function testMetadataOk()
    {
        $validator = new ImageMetadataRule();

        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(
            name: 'abc.jpg',
            takenAt: '2016-12-19 12:27:00',
            lng: 52.220,
            lat: 28.123,
            gpsAltitude: -1500,
            distanceToGround: 10,
            area: 2.6,
            yaw: 180
        ));
        $this->assertTrue($validator->passes(null, $metadata));
    }

    public function testMetadataNoLat()
    {
        $validator = new ImageMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(
            name: 'abc.jpg',
            lng: 52.220
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataNoLng()
    {
        $validator = new ImageMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(
            name: 'abc.jpg',
            lat: 28.123
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLat()
    {
        $validator = new ImageMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(
            name: 'abc.jpg',
            lng: 50,
            lat: 91
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLng()
    {
        $validator = new ImageMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(
            name: 'abc.jpg',
            lng: 181,
            lat: 50
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidYaw()
    {
        $validator = new ImageMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(
            name: 'abc.jpg',
            yaw: 361
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testEmptyFilename()
    {
        $validator = new ImageMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(name: ''));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testEmpty()
    {
        $validator = new ImageMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new ImageMetadata(name: 'abc.jpg'));
        $this->assertFalse($validator->passes(null, $metadata));
    }
}
