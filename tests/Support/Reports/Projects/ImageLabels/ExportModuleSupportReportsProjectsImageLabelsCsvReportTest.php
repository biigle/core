<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\ImageLabels;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\ImageLabels\CsvReport;

class CsvReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new CsvReport(ProjectTest::make());
        $this->assertEquals('CSV image label report', $report->getName());
        $this->assertEquals('csv_image_label_report', $report->getFilename());
    }
}
