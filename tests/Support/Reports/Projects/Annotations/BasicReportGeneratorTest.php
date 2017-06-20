<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\BasicReportGenerator;

class BasicReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new BasicReportGenerator;
        $this->assertEquals('basic annotation report', $generator->getName());
        $this->assertEquals('basic_annotation_report', $generator->getFilename());
    }
}
