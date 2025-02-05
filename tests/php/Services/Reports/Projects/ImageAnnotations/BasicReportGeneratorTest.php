<?php

namespace Biigle\Tests\Services\Reports\Projects\ImageAnnotations;

use Biigle\Services\Reports\Projects\ImageAnnotations\BasicReportGenerator;
use TestCase;

class BasicReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new BasicReportGenerator;
        $this->assertEquals('basic image annotation report', $generator->getName());
        $this->assertEquals('basic_image_annotation_report', $generator->getFilename());
    }
}
