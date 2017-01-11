<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\AreaReport;

class AreaReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new AreaReport(ProjectTest::make());
        $this->assertEquals('annotation area report', $report->getName());
        $this->assertEquals('annotation_area_report', $report->getFilename());
    }
}
