<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\ImageAnnotations\ExtendedReportGenerator;
use Biigle\Volume;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use TestCase;

class ExtendedReportGeneratorTest extends TestCase
{
    private $columns = ['image_filename', 'label_hierarchy', 'annotation_count'];

    public function testProperties()
    {
        $generator = new ExtendedReportGenerator;
        $this->assertSame('extended image annotation report', $generator->getName());
        $this->assertSame('extended_image_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.xlsx', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
        ]);
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->save();

        ImageAnnotationLabelTest::create([
            'annotation_id' => $al->annotation_id,
            'label_id' => $al->label_id,
        ]);

        $al2 = ImageAnnotationLabelTest::create(['annotation_id' => $al->annotation_id]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with([$volume->name]);

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

        $generator = new ExtendedReportGenerator;
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
            'image_id' => $image->id,
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

        $generator = new ExtendedReportGenerator([
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
            'image_id' => $image->id,
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
            ->with(["{$al1->user->firstname} {$al1->user->lastname}"]);

        $mock->shouldReceive('put')
            ->once()
            ->with(["{$al2->user->firstname} {$al2->user->lastname}"]);

        $mock->shouldReceive('put')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([$image->filename, $al1->label->name, 1]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$image->filename, $al2->label->name, 1]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new ExtendedReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
}
