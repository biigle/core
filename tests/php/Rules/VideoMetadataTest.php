<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VideoMetadata as VideoMetadataRule;
use Biigle\Services\MetadataParsing\VideoMetadata;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use TestCase;

class VideoMetadataTest extends TestCase
{
    public function testMetadataOk()
    {
        $validator = new VideoMetadataRule();

        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(
            name: 'abc.mp4',
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
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(
            name: 'abc.mp4',
            lng: 52.220
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataNoLatFrame()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $fileMeta = new VideoMetadata(name: 'abc.mp4');
        $fileMeta->addFrame('2016-12-19 12:27:00', lng: 52.220);
        $metadata->addFile($fileMeta);
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataNoLng()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(
            name: 'abc.mp4',
            lat: 28.123
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataNoLngFrame()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $fileMeta = new VideoMetadata(name: 'abc.mp4');
        $fileMeta->addFrame('2016-12-19 12:27:00', lat: 28.123);
        $metadata->addFile($fileMeta);
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLat()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(
            name: 'abc.mp4',
            lng: 50,
            lat: 91
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLatFrame()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $fileMeta = new VideoMetadata(name: 'abc.mp4');
        $fileMeta->addFrame('2016-12-19 12:27:00', lng: 50, lat: 91);
        $metadata->addFile($fileMeta);
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLng()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(
            name: 'abc.mp4',
            lng: 181,
            lat: 50
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidLngFrame()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $fileMeta = new VideoMetadata(name: 'abc.mp4');
        $fileMeta->addFrame('2016-12-19 12:27:00', lng: 181, lat: 50);
        $metadata->addFile($fileMeta);
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidYaw()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(
            name: 'abc.mp4',
            yaw: 361
        ));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMetadataInvalidYawFrame()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $fileMeta = new VideoMetadata(name: 'abc.mp4');
        $fileMeta->addFrame('2016-12-19 12:27:00', yaw: 361);
        $metadata->addFile($fileMeta);
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testEmptyFilename()
    {
        $validator = new VideoMetadataRule();
        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(name: ''));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testEmpty()
    {
        $validator = new VideoMetadataRule(['abc.jpg']);
        $metadata = new VolumeMetadata;
        $metadata->addFile(new VideoMetadata(name: 'abc.jpg'));
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMultipleFrames()
    {
        $validator = new VideoMetadataRule();

        $metadata = new VolumeMetadata;
        $fileMeta = new VideoMetadata(
            name: 'abc.mp4',
            takenAt: '2016-12-19 12:27:00',
            lng: 52.220,
            lat: 28.123
        );
        $fileMeta->addFrame(
            takenAt: '2016-12-19 12:28:00',
            lng: 52.230,
            lat: 28.133
        );
        $metadata->addFile($fileMeta);
        $this->assertTrue($validator->passes(null, $metadata));
    }
}
