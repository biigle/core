<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Volumes\Annotations;

use App;
use File;
use Mockery;
use TestCase;
use Biigle\Shape;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Export\Volume;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Export\Support\Exec;
use Biigle\Modules\Export\Support\CsvFile;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\FullReport;

class FullReportTest extends TestCase
{
    public function testProperties()
    {
        $report = new FullReport(VolumeTest::make());
        $this->assertEquals('full annotation report', $report->getName());
        $this->assertEquals('full_annotation_report', $report->getFilename());
        $this->assertEquals('xlsx', $report->getExtension());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = AnnotationLabelTest::create([
            'label_id' => $child->id,
        ]);
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->attrs = ['laserpoints' => ['area' => 3.1415]];
        $al->annotation->image->save();

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
            ->with([$volume->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with(['image filename', 'annotation id', 'annotation shape', 'x/radius', 'y', 'labels', 'image area in m²']);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al->annotation->image->filename,
                $al->annotation_id,
                "{$root->name} > {$child->name}",
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
                3.1415,
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

        with(new FullReport($volume))->generateReport();
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        $label1 = LabelTest::create();
        $label2 = LabelTest::create();

        $image = ImageTest::create([
            'attrs' => ['some' => 'attrs'],
        ]);

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
            ->andReturn('abc', 'def');

        $mock->shouldReceive('put')
            ->once()
            ->with([$label1->tree->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$label2->tree->name]);

        $mock->shouldReceive('put')
            ->twice()
            ->with(['image filename', 'annotation id', 'annotation shape', 'x/radius', 'y', 'labels', 'image area in m²']);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $image->filename,
                $annotation->id,
                $label1->name,
                $annotation->shape->name,
                json_encode($annotation->points),
                null,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $image->filename,
                $annotation->id,
                $label2->name,
                $annotation->shape->name,
                json_encode($annotation->points),
                null,
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

        $report = new FullReport($image->volume, ['separateLabelTrees' => true]);
        $report->generateReport();
    }

}
