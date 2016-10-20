<?php

use Dias\Modules\Export\Support\Reports\Projects\Annotations\BasicReport;

class ExportModuleSupportReportsProjectsAnnotationsBasicReportTest extends TestCase
{

    public function testProperties()
    {
        $report = new BasicReport(ProjectTest::make());
        $this->assertEquals('basic annotation report', $report->getName());
        $this->assertEquals('basic_annotation_report', $report->getFilename());
    }
}
