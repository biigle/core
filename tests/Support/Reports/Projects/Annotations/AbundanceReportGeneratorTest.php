<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\Annotations;

use Biigle\Modules\Reports\Support\Reports\Projects\Annotations\AbundanceReportGenerator;
use TestCase;

class AbundanceReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AbundanceReportGenerator;
        $this->assertEquals('abundance annotation report', $generator->getName());
        $this->assertEquals('abundance_annotation_report', $generator->getFilename());
    }
}
