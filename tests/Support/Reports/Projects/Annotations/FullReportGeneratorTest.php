<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\FullReportGenerator;

class FullReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $report = new FullReportGenerator(ProjectTest::make());
        $this->assertEquals('full annotation report', $report->getName());
        $this->assertEquals('full_annotation_report', $report->getFilename());
    }
}
