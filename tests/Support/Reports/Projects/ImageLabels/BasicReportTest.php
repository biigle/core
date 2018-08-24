<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageLabels;

use TestCase;
use Biigle\Modules\Reports\Support\Reports\Projects\ImageLabels\BasicReportGenerator;

class BasicReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new BasicReportGenerator;
        $this->assertEquals('basic image label report', $generator->getName());
        $this->assertEquals('basic_image_label_report', $generator->getFilename());
    }
}
