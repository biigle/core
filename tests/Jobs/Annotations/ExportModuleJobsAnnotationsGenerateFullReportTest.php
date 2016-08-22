<?php

use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\Full;
use Dias\Modules\Export\Jobs\Annotations\GenerateFullReport;

class ExportModuleJobsAnnotationsGenerateFullReportTest extends TestCase {

    public function testGenerateReport()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->attrs = ['image' => 'attrs'];
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
                json_encode(['image' => 'attrs']),
            ]);

        $mock->shouldReceive('close')
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


        with(new GenerateFullReport($project, $user))->generateReport();
    }
}
