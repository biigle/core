<?php

namespace Dias\Tests\Modules\Export\Support\Reports\Transects\Annotations;

use App;
use File;
use Mockery;
use TestCase;
use Dias\Shape;
use Dias\Tests\LabelTest;
use Dias\Tests\ImageTest;
use Dias\Tests\TransectTest;
use Dias\Tests\AnnotationTest;
use Dias\Modules\Export\Transect;
use Dias\Tests\AnnotationLabelTest;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\ExtendedReport;

class ExtendedReportTest extends TestCase
{
    private $columns = ['image_filename', 'label_hierarchy', 'annotation_count'];

    public function testProperties()
    {
        $report = new ExtendedReport(TransectTest::make());
        $this->assertEquals('extended annotation report', $report->getName());
        $this->assertEquals('extended_annotation_report', $report->getFilename());
        $this->assertEquals('xlsx', $report->getExtension());
    }

    public function testGenerateReport()
    {
        $transect = TransectTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = AnnotationLabelTest::create([
            'label_id' => $child->id,
        ]);
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
            ->with([$transect->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([$al->annotation->image->filename, "{$root->name} > {$child->name}", 2]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$al->annotation->image->filename, $al2->label->name, 1]);

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

        with(new ExtendedReport($transect))->generateReport();
    }

    public function testGenerateReportSeparateLabelTrees()
    {
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
            ->with([$image->filename, $label1->name, 1]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$image->filename, $label2->name, 1]);

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

        $report = new ExtendedReport($image->transect, ['separateLabelTrees' => true]);
        $report->generateReport();
    }
}
