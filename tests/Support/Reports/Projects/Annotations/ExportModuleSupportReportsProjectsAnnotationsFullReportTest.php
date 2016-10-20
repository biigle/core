<?php

use Dias\Modules\Export\Support\Reports\Projects\Annotations\FullReport;

class ExportModuleSupportReportsProjectsAnnotationsFullReportTest extends TestCase
{

    public function testProperties()
    {
        $report = new FullReport(ProjectTest::make());
        $this->assertEquals('full annotation report', $report->getName());
        $this->assertEquals('full_annotation_report', $report->getFilename());
    }
}
