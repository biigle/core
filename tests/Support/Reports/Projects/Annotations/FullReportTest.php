<?php

namespace Dias\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Dias\Tests\ProjectTest;
use Dias\Modules\Export\Support\Reports\Projects\Annotations\FullReport;

class FullReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new FullReport(ProjectTest::make());
        $this->assertEquals('full annotation report', $report->getName());
        $this->assertEquals('full_annotation_report', $report->getFilename());
    }
}
