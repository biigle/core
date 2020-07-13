<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\Annotations;

use Biigle\Modules\Reports\Support\Reports\Projects\Annotations\AreaReportGenerator;
use TestCase;

class AreaReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AreaReportGenerator;
        $this->assertEquals('annotation area report', $generator->getName());
        $this->assertEquals('annotation_area_report', $generator->getFilename());
    }
}
