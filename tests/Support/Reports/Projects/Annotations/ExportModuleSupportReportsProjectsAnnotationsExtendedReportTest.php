<?php

use Dias\Modules\Export\Support\Reports\Projects\Annotations\ExtendedReport;

class ExportModuleSupportReportsProjectsAnnotationsExtendedReportTest extends TestCase
{

    public function testProperties()
    {
        $report = new ExtendedReport(ProjectTest::make());
        $this->assertEquals('extended annotation report', $report->getName());
        $this->assertEquals('extended_annotation_report', $report->getFilename());
    }
}
