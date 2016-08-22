<?php

use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\Extended;
use Dias\Modules\Export\Jobs\Annotations\GenerateExtendedReport;

class ExportModuleJobsAnnotationsGenerateExtendedReportTest extends TestCase {

    public function testHandle()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();
        AnnotationLabelTest::create([
            'annotation_id' => $al->annotation_id,
            'label_id' => $al->label_id,
        ]);

        $al2 = AnnotationLabelTest::create(['annotation_id' => $al->annotation_id]);

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
            ->with([$al->annotation->image->filename, $al->label->name, 2]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$al->annotation->image->filename, $al2->label->name, 1]);

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

        App::singleton(Extended::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->once()
            ->withArgs([
                'export::emails.report',
                [
                    'user' => $user,
                    'type' => 'extended',
                    'project' => $project,
                    'uuid' => 'abc123',
                    'filename' => "biigle_{$project->id}_extended_report.xlsx",
                ],
                Mockery::type('callable')
            ]);


        with(new GenerateExtendedReport($project, $user))->handle();
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

        App::singleton(Extended::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->never();

        with(new GenerateExtendedReport($project, $user))->handle();
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

        App::singleton(Extended::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->never();

        $this->setExpectedException('Exception');
        with(new GenerateExtendedReport($project, $user))->handle();
    }
}
