<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\AnnotationLocationReportGenerator;
use TestCase;

class AnnotationLocationReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AnnotationLocationReportGenerator;
        $this->assertEquals('annotation location image annotation report', $generator->getName());
        $this->assertEquals('annotation_location_image_annotation_report', $generator->getFilename());
    }
}
