<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\FullReport;

class FullReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new FullReport(ProjectTest::make());
        $this->assertEquals('full annotation report', $report->getName());
        $this->assertEquals('full_annotation_report', $report->getFilename());
    }
}
