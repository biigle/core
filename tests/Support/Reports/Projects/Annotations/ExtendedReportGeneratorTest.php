<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\Annotations;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\Annotations\ExtendedReportGenerator;

class ExtendedReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ExtendedReportGenerator;
        $this->assertEquals('extended annotation report', $generator->getName());
        $this->assertEquals('extended_annotation_report', $generator->getFilename());
    }
}
