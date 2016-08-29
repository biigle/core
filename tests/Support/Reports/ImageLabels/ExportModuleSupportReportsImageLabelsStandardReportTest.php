<?php

use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\ImageLabels\StandardReport;

class ExportModuleSupportReportsImageLabelsStandardReportTest extends TestCase {

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

        // for the AvailableReport
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();
        $mock->path = 'abc';

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
        $mock->code = 0;
        App::singleton(Exec::class, function () use ($mock) {
            return $mock;
        });

        with(new StandardReport($project))->generateReport();
    }
}
