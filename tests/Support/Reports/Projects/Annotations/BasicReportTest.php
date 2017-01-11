<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\BasicReport;

class BasicReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new BasicReport(ProjectTest::make());
        $this->assertEquals('basic annotation report', $report->getName());
        $this->assertEquals('basic_annotation_report', $report->getFilename());
    }
}
