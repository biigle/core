<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Shape;
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
}
