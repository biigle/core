<?php

use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\ImageLabels\CsvReport;

class ExportModuleSupportReportsImageLabelsCsvReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new CsvReport(ProjectTest::make());
        $this->assertEquals('CSV image label report', $report->getName());
        $this->assertEquals('csv_image_label_report', $report->getFilename());
        $this->assertEquals('zip', $report->getExtension());
    }

    public function testGenerateReport()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $il = ImageLabelTest::create([
            'image_id' => ImageTest::create([
                'transect_id' => $transect->id,
                'filename' => 'foo.jpg',
            ])->id,
            'label_id' => $child->id,
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
                'image_label_id',
                'image_id',
                'filename',
                'user_id',
                'firstname',
                'lastname',
                'label_id',
                'label_name',
            ]);

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
                "{$root->name} > {$child->name}",
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
