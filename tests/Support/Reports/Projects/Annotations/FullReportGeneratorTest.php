<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Modules\Reports\Support\Reports\Projects\Annotations\FullReportGenerator;

class FullReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new FullReportGenerator;
        $this->assertEquals('full annotation report', $generator->getName());
        $this->assertEquals('full_annotation_report', $generator->getFilename());
    }
}
