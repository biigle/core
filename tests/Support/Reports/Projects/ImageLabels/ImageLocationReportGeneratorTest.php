<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageLabels;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageLabels\ImageLocationReportGenerator;
use TestCase;

class ImageLocationReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageLocationReportGenerator;
        $this->assertEquals('image location image label report', $generator->getName());
        $this->assertEquals('image_location_image_label_report', $generator->getFilename());
    }
}
