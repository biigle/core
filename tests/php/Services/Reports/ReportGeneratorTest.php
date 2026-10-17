<?php

namespace Biigle\Tests\Services\Reports;

use Biigle\Enums\ReportType;
use Biigle\Project;
use Biigle\Services\Reports\Projects\ImageMetadataReportGenerator as ProjectImageMetadataReportGenerator;
use Biigle\Services\Reports\Projects\VideoMetadataReportGenerator as ProjectVideoMetadataReportGenerator;
use Biigle\Services\Reports\ReportGenerator;
use Biigle\Services\Reports\Volumes\ImageAnnotations\BasicReportGenerator;
use Biigle\Services\Reports\Volumes\ImageMetadataReportGenerator;
use Biigle\Services\Reports\Volumes\VideoMetadataReportGenerator;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Video;
use Biigle\Volume;
use Exception;
use File;
use Mockery;
use TestCase;

class ReportGeneratorTest extends TestCase
{
    public function testGet()
    {
        $type = ReportType::IMAGE_ANNOTATIONS_BASIC;
        $this->assertInstanceOf(
            BasicReportGenerator::class,
            ReportGenerator::get(Volume::class, $type)
        );
    }

    public function testGetAllVolumeExist()
    {
        foreach (collect(ReportType::cases()) as $type) {
            $this->assertNotNull(ReportGenerator::get(Volume::class, $type));
        }
    }

    public function testGetAllProjectExist()
    {
        foreach (collect(ReportType::cases()) as $type) {
            $this->assertNotNull(ReportGenerator::get(Project::class, $type));
        }
    }

    public function testGetVideoMetadata()
    {
        $this->assertInstanceOf(
            VideoMetadataReportGenerator::class,
            ReportGenerator::get(Volume::class, ReportType::VIDEO_METADATA)
        );
        $this->assertInstanceOf(
            ProjectVideoMetadataReportGenerator::class,
            ReportGenerator::get(Project::class, ReportType::VIDEO_METADATA)
        );
    }

    public function testGetImageMetadata()
    {
        $this->assertInstanceOf(
            ImageMetadataReportGenerator::class,
            ReportGenerator::get(Volume::class, ReportType::IMAGE_METADATA)
        );
        $this->assertInstanceOf(
            ProjectImageMetadataReportGenerator::class,
            ReportGenerator::get(Project::class, ReportType::IMAGE_METADATA)
        );
    }

    public function testGetAllVideoLegacyExist()
    {
        $this->assertNotNull(ReportGenerator::get(Video::class, ReportType::VIDEO_ANNOTATIONS_CSV));
    }

    public function testHandleException()
    {
        File::shouldReceive('exists')->andReturn(true);
        File::shouldReceive('delete')->once()->passthru();

        $this->expectException(Exception::class);
        with(new GeneratorStub(['throw' => true]))->generate(VolumeTest::make());
    }

    public function testHandleSourceEmpty()
    {
        $this->expectException(Exception::class);
        with(new GeneratorStub)->generate(null);
    }

    public function testExpandLabelName()
    {
        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $generator = new ReportGenerator;
        $this->assertEquals("{$root->name} > {$child->name}", $generator->expandLabelName($child->id));
    }
}

class GeneratorStub extends ReportGenerator
{
    public function generateReport($path)
    {
        $this->tmpFiles[] = Mockery::mock();
        $this->tmpFiles[0]->shouldReceive('delete')->once();

        if ($this->options->get('throw')) {
            throw new Exception;
        }
    }
}
