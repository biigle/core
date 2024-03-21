<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\Annotator;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndAnnotator;
use Biigle\Shape;
use TestCase;

class ImageMetadataTest extends TestCase
{
    public function testTrimName()
    {
        $data = new ImageMetadata(' filename');
        $this->assertEquals('filename', $data->name);
    }

    public function testIsEmpty()
    {
        $data = new ImageMetadata('filename');
        $this->assertTrue($data->isEmpty());

        $data = new ImageMetadata('filename', area: 10);
        $this->assertFalse($data->isEmpty());
    }

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

    public function testHasAnnotations()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $annotator = new Annotator(321, 'joe user');
        $la = new LabelAndAnnotator($label, $annotator);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$la],
        );

        $this->assertFalse($data->hasAnnotations());
        $data->addAnnotation($annotation);
        $this->assertTrue($data->hasAnnotations());
    }

    public function testHasFileLabels()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $annotator = new Annotator(321, 'joe user');
        $la = new LabelAndAnnotator($label, $annotator);

        $this->assertFalse($data->hasFileLabels());
        $data->addFileLabel($la);
        $this->assertTrue($data->hasFileLabels());
    }

    public function testGetAnnotationLabels()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $annotator = new Annotator(321, 'joe user');
        $la = new LabelAndAnnotator($label, $annotator);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$la],
        );

        $this->assertEquals([], $data->getAnnotationLabels());
        $data->addAnnotation($annotation);
        $this->assertEquals([123 => $label], $data->getAnnotationLabels());
    }
}
