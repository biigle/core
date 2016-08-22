<?php

use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\ImageLabels\Standard;
use Dias\Modules\Export\Jobs\ImageLabels\GenerateStandardReport;

class ExportModuleJobsImageLabelsGenerateStandardReportTest extends TestCase {

    public function testGenerateReport()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $il = ImageLabelTest::create([
            'image_id' => ImageTest::create([
                'transect_id' => $transect->id,
                'filename' => 'foo.jpg',
            ])->id
        ]);

        $il2 = ImageLabelTest::create([
            'image_id' => $il->image_id,
        ]);

        $il3 = ImageLabelTest::create([
            'image_id' => ImageTest::create([
                'transect_id' => $transect->id,
                'filename' => 'bar.jpg',
            ])->id
        ]);

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
            ->with([$il->image->id, $il->image->filename, "{$il->label->name}, {$il2->label->name}"]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$il3->image->id, $il3->image->filename, $il3->label->name]);

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

        App::singleton(Standard::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->once()
            ->withArgs([
                'export::emails.report',
                [
                    'user' => $user,
                    'type' => 'image label',
                    'project' => $project,
                    'uuid' => 'abc123',
                    'filename' => "biigle_{$project->id}_image_label_report.xlsx",
                ],
                Mockery::type('callable')
            ]);


        with(new GenerateStandardReport($project, $user))->generateReport();
    }
}
