<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\ExtendedReport;

class ExtendedReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new ExtendedReport(ProjectTest::make());
        $this->assertEquals('extended annotation report', $report->getName());
        $this->assertEquals('extended_annotation_report', $report->getFilename());
    }
}
