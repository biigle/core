<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Projects;

use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\Modules\Reports\Support\Reports\Projects\ImageIfdoReportGenerator;
use Biigle\Tests\ProjectTest;
use Biigle\Volume;
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
        $volume1 = Volume::factory()->create([
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => IfdoParser::class,
        ]);
        $disk = Storage::fake($volume1->getMetadataFileDisk());
        $disk->put('mymeta.json', 'abc');

        $volume2 = Volume::factory()->create();

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
        $volume = Volume::factory()->create();
        $project = ProjectTest::create();
        $project->addVolumeId($volume->id);

        $generator = new ImageIfdoReportGenerator;
        $generator->setSource($project);

        $this->expectException(Exception::class);
        $generator->getProjectSources();
    }
}
