<?php

use Dias\Shape;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\FullReport;

class ExportModuleSupportReportsAnnotationsFullReportTest extends TestCase {

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

        // once for the StoredReport and one for the CsvFile
        File::shouldReceive('exists')
            ->twice()
            ->andReturn(false);

        $mock = Mockery::mock();
        $mock->path = 'abc';

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
        $mock->code = 0;
        App::singleton(Exec::class, function () use ($mock) {
            return $mock;
        });

        with(new FullReport($project, false))->generateReport();
    }
}
