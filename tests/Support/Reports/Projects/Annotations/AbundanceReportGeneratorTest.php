<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Modules\Reports\Support\Reports\Projects\Annotations\AbundanceReportGenerator;

class AbundanceReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AbundanceReportGenerator;
        $this->assertEquals('abundance annotation report', $generator->getName());
        $this->assertEquals('abundance_annotation_report', $generator->getFilename());
    }
}
