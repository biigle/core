<?php

namespace Biigle\Tests\Modules\Export;

use File;
use Mockery;
use ModelTestCase;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Export\Report;
use Biigle\Modules\Export\Support\Reports\ReportGenerator;

class ReportTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Report::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->user_id);
        $this->assertNotNull($this->model->type_id);
        $this->assertNotNull($this->model->source_id);
        $this->assertNotNull($this->model->source_type);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testCastsOptions()
    {
        $this->model->options = ['a' => true];
        $this->model->save();
        $this->assertEquals(['a' => true], $this->model->fresh()->options);
    }

    public function testGenerate()
    {
        $id = $this->model->id;
        $path = config('export.reports_storage');

        File::shouldReceive('dirname')
            ->once()
            ->andReturn($path);

        File::shouldReceive('isDirectory')
            ->once()
            ->with($path)
            ->andReturn(false);

        File::shouldReceive('makeDirectory')
            ->once()
            ->with($path, 0755, true);

        $mock = Mockery::mock(ReportGenerator::class);
        $mock->shouldReceive('generate')->once()->with("{$path}/{$id}");

        $this->model->setReportGenerator($mock);
        $this->model->generate();
    }

    public function testGetSubject()
    {
        $mock = Mockery::mock(ReportGenerator::class);
        $mock->shouldReceive('getSubject')->once()->andReturn('abcdef');

        $this->model->setReportGenerator($mock);
        $this->assertEquals('abcdef', $this->model->getSubject());
    }

    public function testGetName()
    {
        $mock = Mockery::mock(ReportGenerator::class);
        $mock->shouldReceive('getName')->once()->andReturn('12345');

        $this->model->setReportGenerator($mock);
        $this->assertEquals('12345', $this->model->getName());
    }

    public function testGetFilename()
    {
        $mock = Mockery::mock(ReportGenerator::class);
        $mock->shouldReceive('getFullFilename')->once()->andReturn('report.pdf');

        $this->model->setReportGenerator($mock);
        $this->model->source_id = 123;
        $this->assertEquals('123_report.pdf', $this->model->getFilename());
    }

    public function testGetUrl()
    {
        $this->assertStringEndsWith('reports/'.$this->model->id, $this->model->getUrl());
    }

    public function testObserveSelf()
    {
        File::shouldReceive('delete')->once()->with($this->model->getPath());
        $this->model->delete();
    }

    public function testObserveUser()
    {
        File::shouldReceive('delete')->once()->with([$this->model->getPath()]);
        $this->model->user->delete();
        $this->assertNull($this->model->fresh());
    }

    public function testObserveProjects()
    {
        $project = ProjectTest::create();
        $this->model->source()->associate($project);
        $this->model->save();

        $this->assertNotNull($this->model->fresh()->source);
        $project->delete();
        $this->assertNull($this->model->fresh()->source);
        $this->assertNull($this->model->fresh()->source_id);
        $this->assertNull($this->model->fresh()->source_type);
    }

    public function testObserveVolumes()
    {
        $volume = VolumeTest::create();
        $this->model->source()->associate($volume);
        $this->model->save();

        $this->assertNotNull($this->model->fresh()->source);
        $volume->delete();
        $this->assertNull($this->model->fresh()->source);
        $this->assertNull($this->model->fresh()->source_id);
        $this->assertNull($this->model->fresh()->source_type);
    }
}
