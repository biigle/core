<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects\ImageLabels;

use TestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\Reports\Projects\ImageLabels\BasicReportGenerator;

class BasicReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new BasicReportGenerator;
        $this->assertEquals('basic image label report', $generator->getName());
        $this->assertEquals('basic_image_label_report', $generator->getFilename());
    }
}
