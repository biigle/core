<?php

namespace Dias\Tests\Modules\Export\Support\Reports\Projects\ImageLabels;

use TestCase;
use Dias\Tests\ProjectTest;
use Dias\Modules\Export\Support\Reports\Projects\ImageLabels\BasicReport;

class BasicReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new BasicReport(ProjectTest::make());
        $this->assertEquals('basic image label report', $report->getName());
        $this->assertEquals('basic_image_label_report', $report->getFilename());
    }
}
