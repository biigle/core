<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\VideoLabels;

use Biigle\Modules\Reports\Support\Reports\Projects\VideoLabels\CsvReportGenerator;
use TestCase;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV video label report', $generator->getName());
        $this->assertEquals('csv_video_label_report', $generator->getFilename());
    }
}
