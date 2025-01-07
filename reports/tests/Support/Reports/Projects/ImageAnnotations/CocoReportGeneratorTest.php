<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\CocoReportGenerator;
use TestCase;

class CocoReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new CocoReportGenerator;
        $this->assertEquals('Coco image annotation report', $generator->getName());
        $this->assertEquals('coco_image_annotation_report', $generator->getFilename());
    }
}
