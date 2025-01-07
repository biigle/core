<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations\AnnotationLocationReportGenerator;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class AnnotationLocationReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AnnotationLocationReportGenerator;
        $this->assertEquals('annotation location image annotation report', $generator->getName());
        $this->assertEquals('annotation_location_image_annotation_report', $generator->getFilename());
    }

    public function testSources()
    {
        $generator = new AnnotationLocationReportGenerator;
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
            'attrs' => [
                'width' => 100,
                'height' => 100,
                'metadata' => [
                    'yaw' => 90,
                    'distance_to_ground' => 10,
                ],
            ],
        ]);

        $this->assertEquals([$volume1->id], $generator->getProjectSources()->pluck('id')->all());
    }
}
