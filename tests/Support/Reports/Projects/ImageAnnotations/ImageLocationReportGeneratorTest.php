<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\ImageLocationReportGenerator;
use TestCase;

class ImageLocationReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageLocationReportGenerator;
        $this->assertEquals('image location image annotation report', $generator->getName());
        $this->assertEquals('image_location_image_annotation_report', $generator->getFilename());
    }
}
