<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\VideoAnnotations;

use TestCase;
use Biigle\Modules\Videos\VideosServiceProvider;
use Biigle\Modules\Reports\Support\Reports\Projects\VideoAnnotations\CsvReportGenerator;

class CsvReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        if (!class_exists(VideosServiceProvider::class)) {
            $this->markTestSkipped('Requires the biigle/videos module.');
        }
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV video annotation report', $generator->getName());
        $this->assertEquals('csv_video_annotation_report', $generator->getFilename());
    }
}
