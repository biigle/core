<?php

namespace Biigle\Tests\Services\Reports\Projects;

use Biigle\MediaType;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\Services\Reports\Projects\VideoIfdoReportGenerator;
use Biigle\Tests\ProjectTest;
use Biigle\Volume;
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
        $volume1 = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => IfdoParser::class,
        ]);
        $disk = Storage::fake($volume1->getMetadataFileDisk());
        $disk->put('mymeta.json', 'abc');

        $volume2 = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
        ]);

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
        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
        ]);
        $project = ProjectTest::create();
        $project->addVolumeId($volume->id);

        $generator = new VideoIfdoReportGenerator;
        $generator->setSource($project);

        $this->expectException(Exception::class);
        $generator->getProjectSources();
    }
}
