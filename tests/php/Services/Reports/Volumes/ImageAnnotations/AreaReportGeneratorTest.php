<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Modules\Laserpoints\Image as LImage;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\ImageAnnotations\AreaReportGenerator;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use TestCase;

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
        $this->assertSame('image annotation area report', $generator->getName());
        $this->assertSame('image_annotation_area_report', $generator->getFilename());
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
        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'image_id' => $image->id,
            'points' => [100, 100],
        ]);

        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
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

        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::circleId(),
            'image_id' => $image->id,
            'points' => [100, 100, 100],
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $a->id,
                Shape::circleId(), 'Circle',
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

        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::rectangleId(),
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
        ]);

        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $a->id,
                Shape::rectangleId(), 'Rectangle',
                $al->label_id, $al->label->name,
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
        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::polygonId(),
            'image_id' => $image->id,
            'points' => [100, 100, 100, 200, 200, 100, 200, 0],
        ]);

        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $a->id,
                Shape::polygonId(), 'Polygon',
                $al->label_id, $al->label->name,
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
        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::ellipseId(),
            'image_id' => $image->id,
            'points' => [0, 100, 100, 100, 50, 200, 50, 0],
        ]);

        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $a->id,
                Shape::ellipseId(), 'Ellipse',
                $al->label_id, $al->label->name,
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
        if (!class_exists(LImage::class)) {
            $this->markTestSkipped('Reqires the biigle/laserpoints module.');
        }

        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'attrs' => ['laserpoints' => ['area' => 1], 'width' => 1000, 'height' => 1000],
        ]);

        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::rectangleId(),
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
        ]);

        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $a->id,
                Shape::rectangleId(), 'Rectangle',
                $al->label_id, $al->label->name,
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

        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::rectangleId(),
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label1->id,
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label2->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($label1->tree->name);

        $mock->shouldReceive('put')
            ->once()
            ->with($label2->tree->name);

        $mock->shouldReceive('putCsv')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $annotation->id,
                Shape::rectangleId(), 'Rectangle',
                $al1->label_id, $al1->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 20000,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $annotation->id,
                Shape::rectangleId(), 'Rectangle',
                $al2->label_id, $al2->label->name,
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

    public function testGenerateReportSeparateUsers()
    {
        $image = ImageTest::create();

        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::rectangleId(),
            'image_id' => $image->id,
            'points' => [100, 100, 100, 300, 200, 300, 200, 100],
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with("{$al1->user->firstname} {$al1->user->lastname}");

        $mock->shouldReceive('put')
            ->once()
            ->with("{$al2->user->firstname} {$al2->user->lastname}");

        $mock->shouldReceive('putCsv')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $annotation->id,
                Shape::rectangleId(), 'Rectangle',
                $al1->label_id, $al1->label->name,
                $image->id, $image->filename,
                '', '', '',
                200, 100, 20000,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $annotation->id,
                Shape::rectangleId(), 'Rectangle',
                $al2->label_id, $al2->label->name,
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
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportLineString()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        // It's a simple open box so the length can be easily calculated manually.
        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::lineId(),
            'image_id' => $image->id,
            'points' => [100, 100, 100, 200, 200, 200, 200, 100],
        ]);

        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $a->id,
                Shape::lineId(), 'LineString',
                $al->label_id, $al->label->name,
                $image->id, $image->filename,
                '', '', '',
                300, 0, 0,
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
}
