<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\AbundanceReportGenerator;
use TestCase;

class AbundanceReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AbundanceReportGenerator;
        $this->assertEquals('abundance image annotation report', $generator->getName());
        $this->assertEquals('abundance_image_annotation_report', $generator->getFilename());
    }
}
