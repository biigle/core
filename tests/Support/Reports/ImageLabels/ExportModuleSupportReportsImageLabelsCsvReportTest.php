<?php

use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\ImageLabels\CsvReport;

class ExportModuleSupportReportsImageLabelsCsvReportTest extends TestCase {

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

        // for the AvailableReport
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();
        $mock->path = 'abc';

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $il->id,
                $il->image_id,
                $il->image->filename,
                $il->user_id,
                $il->user->firstname,
                $il->user->lastname,
                $il->label_id,
                $il->label->name,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')->once();
        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        with(new CsvReport($project))->generateReport();
    }
}
