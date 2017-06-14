<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Volumes\Annotations;

use App;
use Mockery;
use TestCase;
use Biigle\Shape;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Export\Support\CsvFile;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\AreaReportGenerator;

class AreaReportGeneratorTest extends TestCase
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
        'annotation_area_sqpx',
    ];

    public function testProperties()
    {
        $report = new AreaReportGenerator(VolumeTest::make());
        $this->assertEquals('annotation area report', $report->getName());
        $this->assertEquals('annotation_area_report', $report->getFilename());
        $this->assertStringEndsWith('.xlsx', $report->getFullFilename());
    }

    public function testGenerateReportShapes()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
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

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with([$volume->name]);

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
                200, 200, 10000 * M_PI,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $a2->id,
                Shape::$rectangleId, 'Rectangle',
                $al2->id, $al2->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 20000,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $a3->id,
                Shape::$polygonId, 'Polygon',
                $al3->id, $al3->label->name,
                $image->id, $image->filename,
                '', '', '',
                100, 200, 10000,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSqm()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'attrs' => ['laserpoints' => ['area' => 1, 'px' => 1000 * 1000]],
        ]);

        $a = AnnotationTest::create([
            'shape_id' => Shape::$rectangleId,
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
        ]);

        $al = AnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with([$volume->name]);

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
                200, 100, 20000,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
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

        $mock = Mockery::mock();
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
                200, 100, 20000,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $annotation->id,
                Shape::$rectangleId, 'Rectangle',
                $al2->id, $al2->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 20000,
            ]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator($image->volume, [
            'separateLabelTrees' => true,
        ]);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
}
