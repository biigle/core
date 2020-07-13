<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\Annotations;

use Biigle\Modules\Reports\Support\Reports\Projects\Annotations\ExtendedReportGenerator;
use TestCase;

class ExtendedReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ExtendedReportGenerator;
        $this->assertEquals('extended annotation report', $generator->getName());
        $this->assertEquals('extended_annotation_report', $generator->getFilename());
    }
}
