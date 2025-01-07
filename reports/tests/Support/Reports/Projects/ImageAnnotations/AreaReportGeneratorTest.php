<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\AreaReportGenerator;
use TestCase;

class AreaReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AreaReportGenerator;
        $this->assertEquals('image annotation area report', $generator->getName());
        $this->assertEquals('image_annotation_area_report', $generator->getFilename());
    }
}
