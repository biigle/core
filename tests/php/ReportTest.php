<?php

namespace Biigle\Tests;

use Biigle\Report;
use Biigle\Services\Reports\ReportGenerator;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Carbon\Carbon;
use File;
use Mockery;
use ModelTestCase;
use Storage;

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
        $this->assertNotNull($this->model->source_name);
        $this->assertNull($this->model->ready_at);
    }

    public function testCastsOptions()
    {
        $this->model->options = ['a' => true];
        $this->model->save();
        $this->assertEquals(['a' => true], $this->model->fresh()->options);
    }

    public function testGenerate()
    {
        config(['reports.storage_disk' => 'test']);
        Storage::fake('test');
        $disk = Storage::disk('test');
        $disk->put('tmp.file', 'content');

        $id = $this->model->id;
        $path = config('reports.reports_storage');

        $mock = Mockery::mock(ReportGenerator::class);
        $mock->shouldReceive('generate')
            ->once()
            ->with($this->model->source)
            ->andReturn($disk->path('tmp.file'));

        $this->model->setReportGenerator($mock);
        $this->model->generate();

        $this->assertTrue($disk->exists($this->model->getStorageFilename()));
        $this->assertFalse($disk->exists('tmp.file'));
    }

    public function testGenerateSourceDeleted()
    {
        $this->model->source()->delete();
        $this->expectException(\Exception::class);
        $this->model->fresh()->generate();
    }

    public function testSourceName()
    {
        $source = VolumeTest::create();
        $this->model->source()->associate($source);
        $this->assertEquals($source->name, $this->model->source_name);
        $source->delete();
        $this->assertEquals($source->name, $this->model->source_name);
    }

    public function testGetSubjectAttribute()
    {
        $volume = VolumeTest::create();
        $this->model->source()->associate($volume);
        $this->assertEquals('volume '.$volume->name, $this->model->subject);

        $project = ProjectTest::create();
        $this->model->source()->associate($project);
        $this->assertEquals('project '.$project->name, $this->model->subject);
    }

    public function testGetSubjectAttributeSourceDeleted()
    {
        $subject = $this->model->subject;
        $this->model->source()->delete();
        $this->assertEquals($subject, $this->model->fresh()->subject);
    }

    public function testGetNameAttribute()
    {
        $mock = Mockery::mock(ReportGenerator::class);
        $mock->shouldReceive('getName')->once()->andReturn('123');
        $this->model->setReportGenerator($mock);
        $this->assertEquals('123', $this->model->name);
    }

    public function testGetFilenameAttribute()
    {
        $mock = Mockery::mock(ReportGenerator::class);
        $mock->shouldReceive('getFullFilename')->once()->andReturn('abc.pdf');
        $this->model->setReportGenerator($mock);
        $this->assertEquals($this->model->source_id.'_abc.pdf', $this->model->filename);
    }

    public function testGetUrl()
    {
        $this->assertStringEndsWith('reports/'.$this->model->id, $this->model->getUrl());
    }

    public function testObserveSelf()
    {
        config(['reports.storage_disk' => 'test']);
        Storage::fake('test');
        Storage::disk('test')->put($this->model->getStorageFilename(), 'content');
        $this->model->delete();
        $this->assertFalse(Storage::disk('test')->exists($this->model->getStorageFilename()));
    }

    public function testObserveUser()
    {
        config(['reports.storage_disk' => 'test']);
        Storage::fake('test');
        Storage::disk('test')->put($this->model->getStorageFilename(), 'content');
        $this->model->user->delete();
        $this->assertNull($this->model->fresh());
        $this->assertFalse(Storage::disk('test')->exists($this->model->getStorageFilename()));
    }

    public function testDontObserveProjects()
    {
        $project = ProjectTest::create();
        $this->model->source()->associate($project);
        $this->model->save();

        $this->assertNotNull($this->model->fresh()->source);
        $project->delete();
        $this->assertNull($this->model->fresh()->source);
        $this->assertNotNull($this->model->fresh()->source_id);
        $this->assertNotNull($this->model->fresh()->source_type);
        $this->assertEquals($project->name, $this->model->fresh()->source_name);
    }

    public function testObserveVolumes()
    {
        $volume = VolumeTest::create();
        $this->model->source()->associate($volume);
        $this->model->save();

        $this->assertNotNull($this->model->fresh()->source);
        $volume->delete();
        $this->assertNull($this->model->fresh()->source);
        $this->assertNotNull($this->model->fresh()->source_id);
        $this->assertNotNull($this->model->fresh()->source_type);
        $this->assertEquals($volume->name, $this->model->fresh()->source_name);
    }

    public function testCastsReadyAt()
    {
        $this->model->ready_at = new Carbon;
        $this->model->save();
        $this->assertInstanceOf(Carbon::class, $this->model->fresh()->ready_at);
    }
}
