<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageMetadata;
use TestCase;

class ImageMetadataTest extends TestCase
{
    public function testGetInsertData()
    {
        $data = new ImageMetadata(
            '1.jpg',
            lat: 100,
            lng: 120,
            takenAt: '03/11/2024 16:43:00',
            area: 2.5,
            distanceToGround: 5,
            gpsAltitude: -1500,
            yaw: 50
        );

        $expect = [
            'filename' => '1.jpg',
            'lat' => 100,
            'lng' => 120,
            'taken_at' => '2024-03-11 16:43:00',
            'attrs' => [
                'metadata' => [
                    'area' => 2.5,
                    'distance_to_ground' => 5,
                    'gps_altitude' => -1500,
                    'yaw' => 50,
                ],
            ],
        ];

        $this->assertEquals($expect, $data->getInsertData());
    }
}
