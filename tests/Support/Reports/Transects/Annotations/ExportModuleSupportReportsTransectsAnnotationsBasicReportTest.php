<?php

use Dias\Shape;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\BasicReport;

class ExportModuleSupportReportsTransectsAnnotationsBasicReportTest extends TestCase
{

    public function testProperties()
    {
        $report = new BasicReport(TransectTest::make());
        $this->assertEquals('basic annotation report', $report->getName());
        $this->assertEquals('basic_annotation_report', $report->getFilename());
        $this->assertEquals('pdf', $report->getExtension());
    }

    public function testGenerateReport()
    {
        $transect = TransectTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();
        AnnotationLabelTest::create([
            'annotation_id' => $al->annotation_id,
            'label_id' => $al->label_id,
        ]);

        $al2 = AnnotationLabelTest::create(['annotation_id' => $al->annotation_id]);

        // for the AvailableReport
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('put')
            ->once()
            ->with(['']);

        $mock->shouldReceive('put')
            ->once()
            ->with([$al->label->name, $al->label->color, 2]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$al2->label->name, $al2->label->color, 1]);

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

        with(new BasicReport($transect))->generateReport();
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        // have different label trees
        $label1 = LabelTest::create();
        $label2 = LabelTest::create();

        $image = ImageTest::create();

        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label1->id,
        ]);
        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label2->id,
        ]);

        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->twice()
            ->andReturn('abc');

        $mock->shouldReceive('put')
            ->once()
            ->with([$label1->tree->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$label1->name, $label1->color, 1]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$label2->tree->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$label2->name, $label2->color, 1]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();
        $mock->code = 0;
        App::singleton(Exec::class, function () use ($mock) {
            return $mock;
        });

        $report = new BasicReport($image->transect, ['separateLabelTrees' => true]);
        $report->generateReport();
    }
}
