<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects\Ifdo;

use Biigle\Modules\Reports\Support\Reports\Projects\Ifdo\ImageIfdoReportGenerator;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Exception;
use Storage;
use TestCase;

class ImageIfdoReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageIfdoReportGenerator;
        $this->assertEquals('image iFDO report', $generator->getName());
        $this->assertEquals('image_ifdo_report', $generator->getFilename());
    }

    public function testProcessIfdoVolumesOnly()
    {
        $volume1 = VolumeTest::create();
        $disk = Storage::fake('ifdos');
        $disk->put($volume1->id, 'abc');

        $volume2 = VolumeTest::create();

        $project = ProjectTest::create();
        $project->addVolumeId($volume1->id);
        $project->addVolumeId($volume2->id);

        $generator = new ImageIfdoReportGenerator;
        $generator->setSource($project);

        $sources = $generator->getProjectSources();
        $this->assertCount(1, $sources);
        $this->assertEquals($volume1->id, $sources[0]->id);
    }

    public function testThrowIfNoIfdo()
    {
        $volume = VolumeTest::create();
        $project = ProjectTest::create();
        $project->addVolumeId($volume->id);

        $generator = new ImageIfdoReportGenerator;
        $generator->setSource($project);

        $this->expectException(Exception::class);
        $generator->getProjectSources();
    }
}
