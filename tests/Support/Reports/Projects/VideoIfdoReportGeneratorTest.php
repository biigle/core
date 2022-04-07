<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects;

use Biigle\MediaType;
use Biigle\Modules\Reports\Support\Reports\Projects\VideoIfdoReportGenerator;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Exception;
use Storage;
use TestCase;

class VideoIfdoReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new VideoIfdoReportGenerator;
        $this->assertEquals('video iFDO report', $generator->getName());
        $this->assertEquals('video_ifdo_report', $generator->getFilename());
    }

    public function testProcessIfdoVolumesOnly()
    {
        $volume1 = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $disk = Storage::fake('ifdos');
        $disk->put($volume1->id, 'abc');

        $volume2 = VolumeTest::create(['media_type_id' => MediaType::videoId()]);

        $project = ProjectTest::create();
        $project->addVolumeId($volume1->id);
        $project->addVolumeId($volume2->id);

        $generator = new VideoIfdoReportGenerator;
        $generator->setSource($project);

        $sources = $generator->getProjectSources();
        $this->assertCount(1, $sources);
        $this->assertEquals($volume1->id, $sources[0]->id);
    }

    public function testThrowIfNoIfdo()
    {
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $project = ProjectTest::create();
        $project->addVolumeId($volume->id);

        $generator = new VideoIfdoReportGenerator;
        $generator->setSource($project);

        $this->expectException(Exception::class);
        $generator->getProjectSources();
    }
}
