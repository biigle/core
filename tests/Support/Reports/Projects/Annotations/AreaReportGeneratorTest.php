<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\AreaReportGenerator;

class AreaReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $report = new AreaReportGenerator(ProjectTest::make());
        $this->assertEquals('annotation area report', $report->getName());
        $this->assertEquals('annotation_area_report', $report->getFilename());
    }
}
