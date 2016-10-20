<?php

use Dias\Modules\Export\Support\Reports\Projects\ImageLabels\CsvReport;

class ExportModuleSupportReportsProjectsImageLabelsCsvReportTest extends TestCase
{

    public function testProperties()
    {
        $report = new CsvReport(ProjectTest::make());
        $this->assertEquals('CSV image label report', $report->getName());
        $this->assertEquals('csv_image_label_report', $report->getFilename());
    }
}
