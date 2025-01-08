<?php

namespace Biigle\Tests\Services\Reports\Projects\ImageLabels;

use Biigle\Services\Reports\Projects\ImageLabels\CsvReportGenerator;
use TestCase;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV image label report', $generator->getName());
        $this->assertEquals('csv_image_label_report', $generator->getFilename());
    }
}
