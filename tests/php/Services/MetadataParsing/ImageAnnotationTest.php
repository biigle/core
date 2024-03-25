<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Shape;
use Exception;
use TestCase;

class ImageAnnotationTest extends TestCase
{
    public function testGetInsertData()
    {
        $data = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [],
        );

        $expect = [
            'image_id' => 123,
            'points' => '[10,10]',
            'shape_id' => Shape::pointId(),
        ];

        $this->assertEquals($expect, $data->getInsertData(123));
    }

    public function testValidateLabels()
    {
        $data = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePoints()
    {
        $data = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10, 10],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }
}
