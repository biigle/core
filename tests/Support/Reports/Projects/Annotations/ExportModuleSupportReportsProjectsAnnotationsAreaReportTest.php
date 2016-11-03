<?php

use Dias\Modules\Export\Support\Reports\Projects\Annotations\AreaReport;

class ExportModuleSupportReportsProjectsAnnotationsAreaReportTest extends TestCase
{

    public function testProperties()
    {
        $report = new AreaReport(ProjectTest::make());
        $this->assertEquals('annotation area report', $report->getName());
        $this->assertEquals('annotation_area_report', $report->getFilename());
    }
}
