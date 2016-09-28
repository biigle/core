<?php

use Dias\Modules\Export\Support\Reports\Projects\Annotations\CsvReport;

class ExportModuleSupportReportsProjectsAnnotationsCsvReportTest extends TestCase
{

    public function testProperties()
    {
        $report = new CsvReport(ProjectTest::make());
        $this->assertEquals('CSV annotation report', $report->getName());
        $this->assertEquals('csv_annotation_report', $report->getFilename());
    }
}
