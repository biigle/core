<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\ImageLabels;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\ImageLabels\BasicReportGenerator;

class BasicReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $report = new BasicReportGenerator(ProjectTest::make());
        $this->assertEquals('basic image label report', $report->getName());
        $this->assertEquals('basic_image_label_report', $report->getFilename());
    }
}
