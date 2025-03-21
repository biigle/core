<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Mockery;
use TestCase;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Services\Reports\CsvFile;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Services\Reports\Volumes\ImageAnnotations\AbundanceReportGenerator;

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

        // Inlcude images without labels, too
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);

        $this->assertEmpty($i3->annotations()->get());

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

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['c.jpg', 0, 0]);

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
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $image->volume_id
        ]);

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

        // Show all images on every page
        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0]);

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
        $project = ProjectTest::create();
        $image = ImageTest::create();
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $image->volume_id
        ]);
        $project->addVolumeId($image->volume_id);

        $lt = LabelTreeTest::create();
        $lt->projects()->attach($project->id);

        $l1 = LabelTest::create(['label_tree_id' => $lt->id]);
        $l2 = LabelTest::create(['label_tree_id' => $lt->id]);
        $l3 = LabelTest::create(['label_tree_id' => $lt->id]);

        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $l1->id
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $l2->id
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with("{$al1->user->firstname} {$al1->user->lastname}");

        $mock->shouldReceive('put')
            ->once()
            ->with("{$al2->user->firstname} {$al2->user->lastname}");

        // Report should also include unused labels
        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $l1->name, $l2->name, $l3->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $l1->name, $l2->name, $l3->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 1, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 0, 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0, 0, 0]);

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

        ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);

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

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['c.jpg', 0]);

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
        $image2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

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

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0, 0, 0, 0]);

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

    public function testGenerateReportSeparateLabelTreesAggregateLabels()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->addVolumeId($volume);
        $lt1 = LabelTreeTest::create();
        $lt2 = LabelTreeTest::create();
        $lt1->projects()->attach($project);
        $lt2->projects()->attach($project);

        $root = LabelTest::create(['label_tree_id' => $lt1->id]);
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $childchild = LabelTest::create([
            'parent_id' => $child->id,
            'label_tree_id' => $child->label_tree_id,
        ]);

        $root2 = LabelTest::create(['label_tree_id' => $lt2->id]);
        $child2 = LabelTest::create([
            'parent_id' => $root2->id,
            'label_tree_id' => $root2->label_tree_id,
        ]);

        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $child->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $child2->id,
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

        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with($lt1->name);

        $mock->shouldReceive('put')
            ->once()
            ->with($lt2->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $root->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $root2->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 2]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'separateLabelTrees' => true,
            'aggregateChildLabels' => true,
        ]);
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateUsersAggregateLabels()
    {
        $u = UserTest::create();
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

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $child->id,
            'user_id' => $u->id,
        ]);

        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        $u2 = UserTest::create();

        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $child->id,
            'user_id' => $u2->id,
        ]);

        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $childchild->id,
            'user_id' => $u2->id,
        ]);

        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with("{$u->firstname} {$u->lastname}");

        $mock->shouldReceive('put')
            ->once()
            ->with("{$u2->firstname} {$u2->lastname}");

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $root->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $root->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 2]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'separateUsers' => true,
            'aggregateChildLabels' => true,
        ]);
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
    public function testGenerateReportSeparateLabelTreesAllLabels()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->addVolumeId($volume->id);

        $lt = LabelTreeTest::create();
        $lt2 = LabelTreeTest::create();
        $lt->projects()->attach($project->id);
        $lt2->projects()->attach($project->id);

        $label1 = LabelTest::create(['label_tree_id' => $lt->id]);
        $label2 = LabelTest::create(['label_tree_id' => $lt->id]);
        $label3 = LabelTest::create(['label_tree_id' => $lt2->id]);

        $image = ImageTest::create(['volume_id' => $volume->id]);
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume->id
        ]);

        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label1->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with($lt->name);

        $mock->shouldReceive('put')
            ->once()
            ->with($lt2->name);

        // Unused labels should be included in report
        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $label1->name, $label2->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $label3->name]);

        // Show all images on every page
        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0]);


        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'separateLabelTrees' => true,
            'all_labels' => true
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
}
