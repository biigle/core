<?php

use Dias\Modules\Export\Jobs\GenerateFullReport;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Full;
use Dias\Project;

class ExportModuleJobsGenerateFullReportTest extends TestCase {

    public function testHandle()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();

        // check if the temporary file exists
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with([$transect->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al->annotation->image->filename,
                $al->annotation_id,
                $al->label->name,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
            ]);

        $mock->shouldReceive('delete', 'close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('generate')
            ->once()
            ->with(Mockery::type(Project::class), Mockery::type('array'));

        $mock->shouldReceive('basename')
            ->once()
            ->andReturn('abc123');

        App::singleton(Full::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->once()
            ->withArgs([
                'export::emails.report',
                [
                    'user' => $user,
                    'type' => 'full',
                    'project' => $project,
                    'uuid' => 'abc123',
                    'filename' => "biigle_{$project->id}_full_report.xlsx",
                ],
                Mockery::type('callable')
            ]);


        with(new GenerateFullReport($project, $user))->handle();
    }

    public function testHandleExceptionCsv()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();

        // check if the temporary file exists
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->andThrow('Exception');

        $mock->shouldReceive('delete')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('generate')
            ->never();

        App::singleton(Full::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->never();

        with(new GenerateFullReport($project, $user))->handle();
    }

    public function testHandleExceptionReport()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();

        // check if the temporary file exists
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->twice();

        $mock->shouldReceive('delete', 'close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('generate')
            ->once()
            ->andThrow('Exception');

        $mock->shouldReceive('delete')
            ->once();

        App::singleton(Full::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->never();

        $this->setExpectedException('Exception');
        with(new GenerateFullReport($project, $user))->handle();
    }
}
