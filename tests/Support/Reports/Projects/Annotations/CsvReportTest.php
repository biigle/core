<?php

namespace Dias\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Dias\Tests\ProjectTest;
use Dias\Modules\Export\Support\Reports\Projects\Annotations\CsvReport;

class CsvReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new CsvReport(ProjectTest::make());
        $this->assertEquals('CSV annotation report', $report->getName());
        $this->assertEquals('csv_annotation_report', $report->getFilename());
    }
}
