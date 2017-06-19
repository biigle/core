<?php

namespace Biigle\Tests\Modules\Export\Support\Reports;

use File;
use Mockery;
use TestCase;
use Exception;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\ReportType;
use Biigle\Modules\Export\Support\Reports\ReportGenerator;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\BasicReportGenerator;

class ReportGeneratorTest extends TestCase
{
    public function testGetNotExists()
    {
        $type = factory(ReportType::class)->make();
        $this->assertNull(ReportGenerator::get(VolumeTest::make(), $type));
    }

    public function testGet()
    {
        $type = ReportType::whereName('Annotations\Basic')->first();
        $this->assertInstanceOf(
            BasicReportGenerator::class,
            ReportGenerator::get(VolumeTest::make(), $type)
        );
    }

    public function testGetAllExist()
    {
        $source = VolumeTest::make();
        foreach (ReportType::get() as $type) {
            $this->assertNotNull(ReportGenerator::get($source, $type));
        }
    }

    public function testHandleException()
    {
        File::shouldReceive('dirname')->andReturn('');
        File::shouldReceive('isDirectory')->andReturn(true);
        File::shouldReceive('exists')->with('somepath')->andReturn(true);
        File::shouldReceive('delete')->with('somepath')->once();

        $this->setExpectedException(Exception::class);
        with(new GeneratorStub(VolumeTest::make(), ['throw' => true]))->generate('somepath');
    }

    public function testHandleRegular()
    {
        File::shouldReceive('dirname')
            ->once()
            ->andReturn('some');

        File::shouldReceive('isDirectory')
            ->once()
            ->with('some')
            ->andReturn(false);

        File::shouldReceive('makeDirectory')
            ->once()
            ->with('some', 0755, true);

        with(new GeneratorStub(VolumeTest::make()))->generate('some/path');
    }

    public function testExpandLabelName()
    {
        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $generator = new ReportGenerator(VolumeTest::make());

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
