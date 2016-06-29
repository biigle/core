<?php

use Dias\Modules\Export\Jobs\GenerateBasicReport;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Basic;
use Dias\Project;

class ExportModuleJobsGenerateBasicReportJobTest extends TestCase {

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
            ->with([$al->label->id, $al->label->name, $al->label->color]);

        $mock->shouldReceive('close')
            ->once();

        $mock->shouldReceive('delete')
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

        App::singleton(Basic::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->once()
            ->withArgs([
                'export::emails.report',
                [
                    'user' => $user,
                    'type' => 'basic',
                    'project' => $project,
                    'uuid' => 'abc123',
                ],
                Mockery::type('callable')
            ]);


        with(new GenerateBasicReport($project, $user))->handle();
    }
}
