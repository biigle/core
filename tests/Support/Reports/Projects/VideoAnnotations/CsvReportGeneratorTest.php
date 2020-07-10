<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\VideoAnnotations;

use TestCase;
use Biigle\VideosServiceProvider;
use Biigle\Modules\Reports\Support\Reports\Projects\VideoAnnotations\CsvReportGenerator;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV video annotation report', $generator->getName());
        $this->assertEquals('csv_video_annotation_report', $generator->getFilename());
    }
}
