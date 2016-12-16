<?php

namespace Dias\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Dias\Tests\ProjectTest;
use Dias\Modules\Export\Support\Reports\Projects\Annotations\BasicReport;

class BasicReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new BasicReport(ProjectTest::make());
        $this->assertEquals('basic annotation report', $report->getName());
        $this->assertEquals('basic_annotation_report', $report->getFilename());
    }
}
