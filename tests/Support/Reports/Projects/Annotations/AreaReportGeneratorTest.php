<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\AreaReportGenerator;

class AreaReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AreaReportGenerator;
        $this->assertEquals('annotation area report', $generator->getName());
        $this->assertEquals('annotation_area_report', $generator->getFilename());
    }
}
