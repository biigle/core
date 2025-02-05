<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\ImageAnnotations\AbundanceReportGenerator;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use TestCase;

class AbundanceReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AbundanceReportGenerator;
        $this->assertSame('abundance image annotation report', $generator->getName());
        $this->assertSame('abundance_image_annotation_report', $generator->getFilename());
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

        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $root->id,
        ]);

        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $child->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                'image_filename',
                $root->name,
                $child->name,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['a.jpg', 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['b.jpg', 0, 1]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator;
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

        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label1->id,
        ]);
        ImageAnnotationLabelTest::create([
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
            ->once()
            ->with(['image_filename', $label1->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $label2->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 1]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
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
            ->with("{$al1->user->firstname} {$al1->user->lastname}");

        $mock->shouldReceive('put')
            ->once()
            ->with("{$al2->user->firstname} {$al2->user->lastname}");

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $al1->label->name, $al2->label->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $al1->label->name, $al2->label->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 0, 1]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportAggregateChildLabels()
    {
        $volume = VolumeTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $childchild = LabelTest::create([
            'parent_id' => $child->id,
            'label_tree_id' => $child->label_tree_id,
        ]);

        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $child->id,
        ]);

        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $child->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $childchild->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                'image_filename',
                $root->name,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['a.jpg', 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['b.jpg', 2]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'aggregateChildLabels' => true,
        ]);
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportOnlyLabelsAggregateChildLabels()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);

        $root1 = LabelTest::create();
        $child1 = LabelTest::create([
            'parent_id' => $root1->id,
            'label_tree_id' => $root1->label_tree_id,
        ]);

        // Test case where the child label should not be included.
        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $root1->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $root1->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $child1->id,
        ]);

        $root2 = LabelTest::create();
        $child2 = LabelTest::create([
            'parent_id' => $root2->id,
            'label_tree_id' => $root2->label_tree_id,
        ]);

        // Test case where the root label should not be included but has annotations.
        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $root2->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $root2->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $child2->id,
        ]);

        $root3 = LabelTest::create();
        $child3 = LabelTest::create([
            'parent_id' => $root3->id,
            'label_tree_id' => $root3->label_tree_id,
        ]);

        // Test case where the root label should not be included but has no annotations.
        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $child3->id,
        ]);

        $root4 = LabelTest::create();
        $child4 = LabelTest::create([
            'parent_id' => $root4->id,
            'label_tree_id' => $root4->label_tree_id,
        ]);

        // Test case where the root label should be included but has no annotations.
        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $child4->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                'image_filename',
                $root1->name,
                $child2->name,
                $child3->name,
                $root4->name,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 2, 1, 1, 1]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'aggregateChildLabels' => true,
            'onlyLabels' => [
                $root1->id,
                $child2->id,
                $child3->id,
                $root4->id,
                $child4->id,
            ],
        ]);
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
}
