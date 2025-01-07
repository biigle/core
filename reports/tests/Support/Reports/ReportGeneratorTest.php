<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports;

use Biigle\Modules\Reports\ReportType;
use Biigle\Modules\Reports\Support\Reports\ReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations\BasicReportGenerator;
use Biigle\Project;
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
    public function testGetNotExists()
    {
        $this->expectException(Exception::class);
        ReportGenerator::get(Volume::class, ReportType::factory()->make());
    }

    public function testGet()
    {
        $type = ReportType::whereName('ImageAnnotations\Basic')->first();
        $this->assertInstanceOf(
            BasicReportGenerator::class,
            ReportGenerator::get(Volume::class, $type)
        );
    }

    public function testGetAllVolumeExist()
    {
        foreach (ReportType::get() as $type) {
            $this->assertNotNull(ReportGenerator::get(Volume::class, $type));
        }
    }

    public function testGetAllProjectExist()
    {
        foreach (ReportType::get() as $type) {
            $this->assertNotNull(ReportGenerator::get(Project::class, $type));
        }
    }

    public function testGetAllVideoLegacyExist()
    {
        $this->assertNotNull(ReportGenerator::get(Video::class, ReportType::videoAnnotationsCsv()));
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
