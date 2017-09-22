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
        $generator = new AreaReportGenerator;
        $this->assertEquals('annotation area report', $generator->getName());
        $this->assertEquals('annotation_area_report', $generator->getFilename());
        $this->assertStringEndsWith('.xlsx', $generator->getFullFilename());
    }

    public function testGenerateReportPoint()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        // Should not be included.
        $a = AnnotationTest::create([
            'shape_id' => Shape::$pointId,
            'image_id' => $image->id,
            'points' => [100, 100],
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

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator;
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportCirlce()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        $a = AnnotationTest::create([
            'shape_id' => Shape::$circleId,
            'image_id' => $image->id,
            'points' => [100, 100, 100],
        ]);

        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);
        $al2 = AnnotationLabelTest::create([
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
                Shape::$circleId, 'Circle',
                "{$al1->label_id}, {$al2->label_id}",
                "{$al1->label->name}, {$al2->label->name}",
                $image->id, $image->filename,
                '', '', '',
                200, 200, 10000 * M_PI,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator;
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportRectangle()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
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
                '', '', '',
                200, 100, 20000,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator;
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportPolygon()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        // It's a simple parallelogram so the area can be easily calculated manually.
        $a = AnnotationTest::create([
            'shape_id' => Shape::$polygonId,
            'image_id' => $image->id,
            'points' => [100, 100, 100, 200, 200, 100, 200, 0],
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
                Shape::$polygonId, 'Polygon',
                $al->id, $al->label->name,
                $image->id, $image->filename,
                '', '', '',
                100, 200, 10000,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator;
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportEllipse()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        // It's a simple parallelogram so the area can be easily calculated manually.
        $a = AnnotationTest::create([
            'shape_id' => Shape::$ellipseId,
            'image_id' => $image->id,
            'points' => [0, 100, 100, 100, 50, 200, 50, 0],
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
                Shape::$ellipseId, 'Ellipse',
                $al->id, $al->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 5000 * M_PI,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new AreaReportGenerator;
        $generator->setSource($volume);
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

        $generator = new AreaReportGenerator;
        $generator->setSource($volume);
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

        $generator = new AreaReportGenerator([
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
}
