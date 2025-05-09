<?php

namespace Biigle\Tests\Services\Reports\Projects\ImageLabels;

use Biigle\Services\Reports\Projects\ImageLabels\BasicReportGenerator;
use TestCase;

class BasicReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new BasicReportGenerator;
        $this->assertEquals('basic image label report', $generator->getName());
        $this->assertEquals('basic_image_label_report', $generator->getFilename());
    }
}
