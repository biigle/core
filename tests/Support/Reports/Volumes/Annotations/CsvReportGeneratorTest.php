<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Volumes\Annotations;

use App;
use Mockery;
use TestCase;
use ZipArchive;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Export\Support\CsvFile;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\CsvReportGenerator;

class CsvReportGeneratorTest extends TestCase
{
    private $columns = [
        'annotation_label_id',
        'label_id',
        'label_name',
        'label_hierarchy',
        'user_id',
        'firstname',
        'lastname',
        'image_id',
        'filename',
        'image_longitude',
        'image_latitude',
        'shape_id',
        'shape_name',
        'points',
        'attributes',
    ];

    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV annotation report', $generator->getName());
        $this->assertEquals('csv_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = AnnotationLabelTest::create([
            'label_id' => $child->id,
        ]);
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->attrs = ['image' => 'attrs'];
        $al->annotation->image->save();

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('put')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al->id,
                $child->id,
                $child->name,
                "{$root->name} > {$child->name}",
                $al->user_id,
                $al->user->firstname,
                $al->user->lastname,
                $al->annotation->image_id,
                $al->annotation->image->filename,
                null,
                null,
                $al->annotation->shape->id,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
                json_encode(['image' => 'attrs']),
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

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$volume->id}-my-cool-volume.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CsvReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        $tree1 = LabelTreeTest::create(['name' => 'tree1']);
        $tree2 = LabelTreeTest::create(['name' => 'tree2']);

        $label1 = LabelTest::create(['label_tree_id' => $tree1->id]);
        $label2 = LabelTest::create(['label_tree_id' => $tree2->id]);

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

        $mock = Mockery::mock();
        $mock->shouldReceive('getPath')
            ->twice()
            ->andReturn('abc', 'def');

        $mock->shouldReceive('put')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al1->id,
                $label1->id,
                $label1->name,
                $label1->name,
                $al1->user_id,
                $al1->user->firstname,
                $al1->user->lastname,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                null,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al2->id,
                $label2->id,
                $label2->name,
                $label2->name,
                $al2->user_id,
                $al2->user->firstname,
                $al2->user->lastname,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->id,
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

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$tree1->id}-{$tree1->name}.csv");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$tree2->id}-{$tree2->name}.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CsvReportGenerator([
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($image->volume);
        $generator->generateReport('my/path');
    }
}
