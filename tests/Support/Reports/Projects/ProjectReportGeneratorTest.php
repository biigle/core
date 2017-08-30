<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects;

use App;
use Mockery;
use TestCase;
use ZipArchive;
use Biigle\Volume;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Support\File;
use Biigle\Modules\Export\Support\Reports\Projects\ProjectReportGenerator;

class ProjectReportGeneratorTest extends TestCase
{
    public function testExpandLabelNameOwnTree()
    {
        $project = ProjectTest::create();
        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);
        $project->labelTrees()->attach($root->tree);

        $generator = new ProjectReportGenerator;
        $generator->setSource($project);

        $this->assertEquals("{$root->name} > {$child->name}", $generator->expandLabelName($child->id));
    }

    public function testProperties()
    {
        $generator = new ProjectReportStub;
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerate()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create(['id' => 123]);
        $project->addVolumeId($volume->id);
        $generator = new ProjectReportStub;

        $mock = Mockery::mock();
        $mock->shouldReceive('generate')
            ->with(Mockery::on(function ($v) use ($volume) {
                return $v instanceof Volume && $volume->id === $v->id;
            }), 'my_tmp_file_path')
            ->once();
        $mock->shouldReceive('getFullFilename')->once()
            ->andReturn('my_download_filename.pdf');

        $generator->mock = $mock;

        $mock = Mockery::mock();
        $mock->shouldReceive('getPath')->andReturn('my_tmp_file_path');
        $mock->shouldReceive('delete')->once();
        App::bind(File::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();
        $mock->shouldReceive('open')->once()->andReturn(true);
        $mock->shouldReceive('addFile')->once()
            ->with('my_tmp_file_path', '123_my_download_filename.pdf');
        $mock->shouldReceive('close')->once();

        App::bind(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator->generate($project, 'dir');
    }
}

class ProjectReportStub extends ProjectReportGenerator
{
    public $mock;
    protected function getReportGenerator(Volume $volume)
    {
        return $this->mock;
    }
}
