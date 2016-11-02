<?php

use Dias\Shape;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\AreaReport;

class ExportModuleSupportReportsTransectsAnnotationsAreaReportTest extends TestCase
{
    private $columns = [
        'annotation_id',
        'shape_id',
        'shape_name',
        'label_ids',
        'label_names',
        'image_id',
        'image_filename',
        'annotation_width_m',
        'annotation_height_m',
        'annotation_area_sqm',
        'annotation_width_px',
        'annotation_height_px',
        'annotation_area_px',
    ];

    public function testProperties()
    {
        $report = new AreaReport(TransectTest::make());
        $this->assertEquals('annotation area report', $report->getName());
        $this->assertEquals('annotation_area_report', $report->getFilename());
        $this->assertEquals('xlsx', $report->getExtension());
    }

    public function testGenerateReportShapes()
    {
        $transect = TransectTest::create([
            'name' => 'My Cool Transect',
        ]);

        $image = ImageTest::create([
            'transect_id' => $transect->id,
        ]);

        $a1 = AnnotationTest::create([
            'shape_id' => Shape::$circleId,
            'image_id' => $image->id,
            'points' => [100, 100, 100],
        ]);

        $al11 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
        ]);
        $al12 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
        ]);

        $a2 = AnnotationTest::create([
            'shape_id' => Shape::$rectangleId,
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
        ]);

        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
        ]);

        // It's a simple parallelogram so the area can be easily calculated manually.
        $a3 = AnnotationTest::create([
            'shape_id' => Shape::$polygonId,
            'image_id' => $image->id,
            'points' => [100, 100, 100, 200, 200, 100, 200, 0],
        ]);

        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
        ]);

        // Should not be included.
        $a4 = AnnotationTest::create([
            'shape_id' => Shape::$pointId,
            'image_id' => $image->id,
            'points' => [100, 100],
        ]);

        $al4 = AnnotationLabelTest::create([
            'annotation_id' => $a4->id,
        ]);

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
            ->with([$transect->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $a1->id,
                Shape::$circleId, 'Circle',
                "{$al11->label_id}, {$al12->label_id}",
                "{$al11->label->name}, {$al12->label->name}",
                $image->id, $image->filename,
                '', '', '',
                200, 200, 10000*M_PI
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $a2->id,
                Shape::$rectangleId, 'Rectangle',
                $al2->id, $al2->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 20000
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $a3->id,
                Shape::$polygonId, 'Polygon',
                $al3->id, $al3->label->name,
                $image->id, $image->filename,
                '', '', '',
                100, 200, 10000
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

        with(new AreaReport($transect))->generateReport();
    }

    public function testGenerateReportSqm()
    {
        $transect = TransectTest::create([
            'name' => 'My Cool Transect',
        ]);

        $image = ImageTest::create([
            'transect_id' => $transect->id,
            'attrs' => ['laserpoints' => ['area' => 1, 'px' => 1000*1000]],
        ]);

        $a = AnnotationTest::create([
            'shape_id' => Shape::$rectangleId,
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
        ]);

        $al = AnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

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
            ->with([$transect->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $a->id,
                Shape::$rectangleId, 'Rectangle',
                $al->id, $al->label->name,
                $image->id, $image->filename,
                0.2, 0.1, 0.02,
                200, 100, 20000
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

        with(new AreaReport($transect))->generateReport();
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        $label1 = LabelTest::create();
        $label2 = LabelTest::create();

        $image = ImageTest::create();

        $annotation = AnnotationTest::create([
            'shape_id' => Shape::$rectangleId,
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
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
            ->andReturn('abc', 'def');

        $mock->shouldReceive('put')
            ->once()
            ->with([$label1->tree->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$label2->tree->name]);

        $mock->shouldReceive('put')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $annotation->id,
                Shape::$rectangleId, 'Rectangle',
                $al1->id, $al1->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 20000
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $annotation->id,
                Shape::$rectangleId, 'Rectangle',
                $al2->id, $al2->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 20000
            ]);

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

        $report = new AreaReport($image->transect, ['separateLabelTrees' => true]);
        $report->generateReport();
    }
}
