<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\ExtendedReportGenerator;

class ExtendedReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $report = new ExtendedReportGenerator(ProjectTest::make());
        $this->assertEquals('extended annotation report', $report->getName());
        $this->assertEquals('extended_annotation_report', $report->getFilename());
    }
}
