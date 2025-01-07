<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\FullReportGenerator;
use TestCase;

class FullReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new FullReportGenerator;
        $this->assertEquals('full image annotation report', $generator->getName());
        $this->assertEquals('full_image_annotation_report', $generator->getFilename());
    }
}
