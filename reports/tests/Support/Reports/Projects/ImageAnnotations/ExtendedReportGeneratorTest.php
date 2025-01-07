<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\ExtendedReportGenerator;
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
