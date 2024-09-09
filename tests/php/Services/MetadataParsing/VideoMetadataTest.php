<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\VideoMetadata;
use TestCase;

class VideoMetadataTest extends TestCase
{
    public function testIsEmpty()
    {
        $data = new VideoMetadata('filename');
        $this->assertTrue($data->isEmpty());
        $data->addFrame('2023-12-12 20:26:00');
        $this->assertFalse($data->isEmpty());

        $data = new VideoMetadata('filename', area: 10);
        $this->assertFalse($data->isEmpty());
    }

    public function testGetFrames()
    {
        $data = new VideoMetadata('filename');
        $this->assertTrue($data->getFrames()->isEmpty());

        $data = new VideoMetadata('filename', takenAt: '2023-12-12 20:26:00');
        $frame = $data->getFrames()->first();
        $this->assertEquals('filename', $frame->name);
        $this->assertEquals('2023-12-12 20:26:00', $frame->takenAt);
    }

    public function testAddFrame()
    {
        $data = new VideoMetadata('filename');
        $this->assertTrue($data->getFrames()->isEmpty());
        $data->addFrame('2023-12-12 20:26:00');
        $frame = $data->getFrames()->first();
        $this->assertEquals('filename', $frame->name);
        $this->assertEquals('2023-12-12 20:26:00', $frame->takenAt);
    }

    public function testGetInsertDataPlain()
    {
        $data = new VideoMetadata(
            '1.mp4',
            lat: 100,
            lng: 120,
            area: 2.5,
            distanceToGround: 5,
            gpsAltitude: -1500,
            yaw: 50
        );

        $expect = [
            'filename' => '1.mp4',
            'lat' => [100],
            'lng' => [120],
            'attrs' => [
                'metadata' => [
                    'area' => [2.5],
                    'distance_to_ground' => [5],
                    'gps_altitude' => [-1500],
                    'yaw' => [50],
                ],
            ],
        ];

        $this->assertEquals($expect, $data->getInsertData());
    }

    public function testGetInsertDataFrame()
    {
        $data = new VideoMetadata(
            '1.mp4',
            lat: 100,
            lng: 120,
            takenAt: '03/11/2024 16:43:00',
            area: 2.5,
            distanceToGround: 5,
            gpsAltitude: -1500,
            yaw: 50
        );

        $expect = [
            'filename' => '1.mp4',
            'lat' => [100],
            'lng' => [120],
            'taken_at' => ['2024-03-11 16:43:00'],
            'attrs' => [
                'metadata' => [
                    'area' => [2.5],
                    'distance_to_ground' => [5],
                    'gps_altitude' => [-1500],
                    'yaw' => [50],
                ],
            ],
        ];

        $this->assertEquals($expect, $data->getInsertData());
    }

    public function testGetInsertDataFrames()
    {
        $data = new VideoMetadata('1.mp4');

        $data->addFrame(
            '2024-03-11 16:44:00',
            lat: 110,
            lng: 130,
            area: 3,
            distanceToGround: 4,
            gpsAltitude: -1501,
            yaw: 51
        );

        $data->addFrame(
            '2024-03-11 16:43:00',
            lat: 100,
            lng: 120,
            area: 2.5,
            distanceToGround: 5,
            gpsAltitude: -1500,
            yaw: 50
        );

        $expect = [
            'filename' => '1.mp4',
            'lat' => [100, 110],
            'lng' => [120, 130],
            // Metadata should be sorted by taken_at.
            'taken_at' => ['2024-03-11 16:43:00', '2024-03-11 16:44:00'],
            'attrs' => [
                'metadata' => [
                    'area' => [2.5, 3],
                    'distance_to_ground' => [5, 4],
                    'gps_altitude' => [-1500, -1501],
                    'yaw' => [50, 51],
                ],
            ],
        ];

        $this->assertEquals($expect, $data->getInsertData());
    }

    public function testGetInsertDataFramesWithGaps()
    {
        $data = new VideoMetadata('1.mp4');

        $data->addFrame(
            '2024-03-11 16:44:00',
            lat: 110,
            lng: 130,
            gpsAltitude: -1501
        );

        $data->addFrame(
            '2024-03-11 16:43:00',
            area: 2.5,
            distanceToGround: 5,
            gpsAltitude: -1500
        );

        $expect = [
            'filename' => '1.mp4',
            'lat' => [null, 110],
            'lng' => [null, 130],
            // Metadata should be sorted by taken_at.
            'taken_at' => ['2024-03-11 16:43:00', '2024-03-11 16:44:00'],
            'attrs' => [
                'metadata' => [
                    'area' => [2.5, null],
                    'distance_to_ground' => [5, null],
                    'gps_altitude' => [-1500, -1501],
                ],
            ],
        ];

        $this->assertEquals($expect, $data->getInsertData());
    }
}
