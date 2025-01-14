<?php

namespace Biigle\Tests\Services\Reports\Projects\VideoAnnotations;

use Biigle\Services\Reports\Projects\VideoAnnotations\CsvReportGenerator;
use TestCase;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV video annotation report', $generator->getName());
        $this->assertEquals('csv_video_annotation_report', $generator->getFilename());
    }
}
