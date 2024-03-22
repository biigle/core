<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\VideoAnnotation;
use Biigle\Shape;
use TestCase;

class VideoAnnotationTest extends TestCase
{
    public function testGetInsertData()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10]],
            frames: [1],
            labels: [],
        );

        $expect = [
            'video_id' => 123,
            'points' => '[[10,10]]',
            'shape_id' => Shape::pointId(),
            'frames' => '[1]',
        ];

        $this->assertEquals($expect, $data->getInsertData(123));
    }
}
