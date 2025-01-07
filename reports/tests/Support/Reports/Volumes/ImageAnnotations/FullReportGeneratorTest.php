<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations\FullReportGenerator;
use Biigle\Modules\Reports\Volume;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use TestCase;

class FullReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new FullReportGenerator;
        $this->assertSame('full image annotation report', $generator->getName());
        $this->assertSame('full_image_annotation_report', $generator->getFilename());
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
        $al->annotation->image->attrs = ['laserpoints' => ['area' => 3.1415]];
        $al->annotation->image->save();

        $mock = Mockery::mock();

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

        $generator = new FullReportGenerator;
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

        $image = ImageTest::create([
            'attrs' => ['some' => 'attrs'],
        ]);

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

        $generator = new FullReportGenerator([
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
        $image = ImageTest::create([
            'attrs' => ['some' => 'attrs'],
        ]);

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
            ->with(['image filename', 'annotation id', 'annotation shape', 'x/radius', 'y', 'labels', 'image area in m²']);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $image->filename,
                $annotation->id,
                $al1->label->name,
                $annotation->shape->name,
                json_encode($annotation->points),
                null,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $image->filename,
                $annotation->id,
                $al2->label->name,
                $annotation->shape->name,
                json_encode($annotation->points),
                null,
            ]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $generator = new FullReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
}
