<?php

namespace Biigle\Tests\Services\Reports\Projects\ImageAnnotations;

use Biigle\Services\Reports\Projects\ImageAnnotations\CsvReportGenerator;
use TestCase;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV image annotation report', $generator->getName());
        $this->assertEquals('csv_image_annotation_report', $generator->getFilename());
    }
}
