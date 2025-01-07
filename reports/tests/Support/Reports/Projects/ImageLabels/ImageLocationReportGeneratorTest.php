<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageLabels;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageLabels\ImageLocationReportGenerator;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class ImageLocationReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageLocationReportGenerator;
        $this->assertEquals('image location image label report', $generator->getName());
        $this->assertEquals('image_location_image_label_report', $generator->getFilename());
    }

    public function testSources()
    {
        $generator = new ImageLocationReportGenerator;
        $project = ProjectTest::create();
        $generator->setSource($project);

        $volume1 = VolumeTest::create();
        $volume2 = VolumeTest::create();

        $project->addVolumeId($volume1->id);
        $project->addVolumeId($volume2->id);

        ImageTest::create([
            'volume_id' => $volume1->id,
            'lat' => 1,
            'lng' => 1,
        ]);

        $this->assertEquals([$volume1->id], $generator->getProjectSources()->pluck('id')->all());
    }
}
