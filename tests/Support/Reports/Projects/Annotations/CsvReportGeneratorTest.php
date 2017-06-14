<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\CsvReportGenerator;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $report = new CsvReportGenerator(ProjectTest::make());
        $this->assertEquals('CSV annotation report', $report->getName());
        $this->assertEquals('csv_annotation_report', $report->getFilename());
    }
}
