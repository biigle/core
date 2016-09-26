<?php

use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\CsvReport;

class ExportModuleSupportReportsAnnotationsCsvReportTest extends TestCase {

    public function testGenerateReport()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create([
            'name' => 'My Cool Transect',
        ]);
        $project->transects()->attach($transect);

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->attrs = ['image' => 'attrs'];
        $al->annotation->image->save();

        // for the AvailableReport
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();
        $mock->path = 'abc';

        $mock->shouldReceive('put')
            ->once()
            ->with([
                'annotation_label_id',
                'label_id',
                'label_name',
                'user_id',
                'firstname',
                'lastname',
                'image_id',
                'filename',
                'shape_id',
                'shape_name',
                'points',
                'attributes',
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al->id,
                $al->label_id,
                $al->label->name,
                $al->user_id,
                $al->user->firstname,
                $al->user->lastname,
                $al->annotation->image_id,
                $al->annotation->image->filename,
                $al->annotation->shape->id,
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

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$transect->id}_my-cool-transect.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        with(new CsvReport($project, false))->generateReport();
    }
}
