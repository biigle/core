<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\Annotations;

use Biigle\Modules\Reports\Support\Reports\Projects\Annotations\CsvReportGenerator;
use TestCase;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV annotation report', $generator->getName());
        $this->assertEquals('csv_annotation_report', $generator->getFilename());
    }
}
