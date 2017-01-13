<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Projects;

use App;
use Mockery;
use TestCase;
use ZipArchive;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Modules\Export\Support\Reports\Projects\Report;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\BasicReport as VolumeReport;

class ReportTest extends TestCase
{
    public function testGetSubject()
    {
        $project = ProjectTest::make();
        $report = new Report($project);
        $this->assertContains($project->name, $report->getSubject());
    }

    public function testExpandLabelNameOwnTree()
    {
        $project = ProjectTest::create();
        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);
        $project->labelTrees()->attach($root->tree);

        $report = new Report($project);

        $this->assertEquals("{$root->name} > {$child->name}", $report->expandLabelName($child->id));
    }

    public function testProperties()
    {
        $report = new ProjectReportStub(ProjectTest::make());
        $this->assertEquals('zip', $report->getExtension());
    }

    public function testGenerate()
    {
        $mock = Mockery::mock();
        $mock->shouldReceive('generate')->once();
        $mock->shouldReceive('getDownloadFilename')->once()
            ->andReturn('my_download_filename.pdf');

        $availableReportMock = Mockery::mock();
        $availableReportMock->path = 'my_tmp_file_path';
        $availableReportMock->shouldReceive('delete')->once();
        $mock->availableReport = $availableReportMock;

        App::bind(VolumeReport::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();
        $mock->shouldReceive('open')->once()->andReturn(true);
        $mock->shouldReceive('addFile')->once()
            ->with('my_tmp_file_path', 'my_download_filename.pdf');
        $mock->shouldReceive('close')->once();

        App::bind(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->addVolumeId($volume->id);

        $report = new ProjectReportStub($project);
        $report->generate();
    }
}

class ProjectReportStub extends Report
{
    protected $volumeReportClass = VolumeReport::class;
}
