<?php

namespace Biigle\Tests\Services\Reports\Projects\ImageAnnotations;

use Biigle\Services\Reports\Projects\ImageAnnotations\ExtendedReportGenerator;
use TestCase;

class ExtendedReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ExtendedReportGenerator;
        $this->assertEquals('extended image annotation report', $generator->getName());
        $this->assertEquals('extended_image_annotation_report', $generator->getFilename());
    }
}
