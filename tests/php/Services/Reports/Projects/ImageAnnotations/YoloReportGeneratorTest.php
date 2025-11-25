<?php

namespace Biigle\Tests\Services\Reports\Projects\ImageAnnotations;

use Biigle\Services\Reports\Projects\ImageAnnotations\YoloReportGenerator;
use TestCase;

class YoloReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new YoloReportGenerator;
        $this->assertEquals('Yolo image annotation report', $generator->getName());
        $this->assertEquals('yolo_image_annotation_report', $generator->getFilename());
    }
}
