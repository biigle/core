<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports;

use File;
use Mockery;
use TestCase;
use Exception;
use Biigle\Volume;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Modules\Videos\Video;
use Biigle\Modules\Reports\ReportType;
use Biigle\Modules\Reports\Support\Reports\ReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Volumes\Annotations\BasicReportGenerator;

class ReportGeneratorTest extends TestCase
{
    public function testGetNotExists()
    {
        $this->expectException(Exception::class);
        ReportGenerator::get(Volume::class, factory(ReportType::class)->make());
    }

    public function testGet()
    {
        $type = ReportType::whereName('Annotations\Basic')->first();
        $this->assertInstanceOf(
            BasicReportGenerator::class,
            ReportGenerator::get(Volume::class, $type)
        );
    }

    public function testGetAllExist()
    {
        foreach (ReportType::where('name', 'not like', 'Video%')->get() as $type) {
            $this->assertNotNull(ReportGenerator::get(Volume::class, $type));
        }
    }

    public function testGetAllVideoExist()
    {
        if (!class_exists(Video::class)) {
            $this->markTestSkipped('Requires the biigle/videos module.');
        }

        foreach (ReportType::where('name', 'like', 'Video%')->get() as $type) {
            $this->assertNotNull(ReportGenerator::get(Video::class, $type));
        }
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
