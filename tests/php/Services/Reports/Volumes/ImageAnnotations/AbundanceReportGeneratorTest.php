<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\ImageAnnotations\AbundanceReportGenerator;
use Biigle\Shape;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
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
        $project = ProjectTest::create();
        $project->addVolumeId($volume);

        $lt = LabelTreeTest::create();
        $lt->projects()->attach($project);

        // Label should be ignored, because it is not used
        LabelTest::create(['label_tree_id' => $lt->id]);

        $root = LabelTest::create(['label_tree_id' => $lt->id]);
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

        // Empty images should be included in the report
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
        // Label should be ignored, because it is not used
        LabelTest::create();

        $image = ImageTest::create();
        // Empty images should be included in the report
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
        // Empty images should be included in the report
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
            ->with(['image_filename', $l1->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $l2->name]);

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
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateUsersAllLabels()
    {
        $project = ProjectTest::create();
        $image = ImageTest::create();
        // Empty images should be included in the report
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
            'allLabels' => true
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
        $project = ProjectTest::create();
        $project->addVolumeId($volume);

        $lt = LabelTreeTest::create();
        $lt->projects()->attach($project);

        $root = LabelTest::create(['label_tree_id' => $lt->id]);
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

        // Empty images should be included in the report
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
        // Empty images should be included in the report
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

        // Empty images should be included in the report
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
        $project = ProjectTest::create();
        $u = UserTest::create();
        $u2 = UserTest::create();
        $volume = VolumeTest::create();
        $project->addVolumeId($volume);
        $lt = LabelTreeTest::create();
        $lt2 = LabelTreeTest::create();
        $lt->projects()->attach($project);
        $lt2->projects()->attach($project);

        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        $root = LabelTest::create(['label_tree_id' => $lt->id]);
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $childchild = LabelTest::create([
            'parent_id' => $child->id,
            'label_tree_id' => $child->label_tree_id,
        ]);

        $root2 = LabelTest::create(['label_tree_id' => $lt2->id]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $child->id,
            'user_id' => $u->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $childchild->id,
            'user_id' => $u->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $child->id,
            'user_id' => $u2->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $root2->id,
            'user_id' => $u2->id,
        ]);

        // Empty images should be included in the report
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
            ->with(['image_filename', $root->name, $root2->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 1, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0, 0]);

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

    public function testGenerateReportSeparateUsersAggregateLabelsRestrictToLabels()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->addVolumeId($volume);

        $lt = LabelTreeTest::create();
        $lt2 = LabelTreeTest::create();
        $lt->projects()->attach($project);
        $lt2->projects()->attach($project);

        $u = UserTest::create();
        $u2 = UserTest::create();

        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        // Empty images should be included in the report
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);

        // Label should not be included in report due to selection
        $root = LabelTest::create(['label_tree_id' => $lt->id]);
        // Label should not be included in report due to selection
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $childchild = LabelTest::create([
            'parent_id' => $child->id,
            'label_tree_id' => $child->label_tree_id,
        ]);

        $root2 = LabelTest::create(['label_tree_id' => $lt2->id]);
        $root3 = LabelTest::create(['label_tree_id' => $lt2->id]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $child->id,
            'user_id' => $u->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $child->id,
            'user_id' => $u2->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $childchild->id,
            'user_id' => $u2->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $childchild->id,
            'user_id' => $u->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $root2->id,
            'user_id' => $u->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $root3->id,
            'user_id' => $u->id,
        ]);

        $mock = Mockery::mock();

        // Create csv only for one user, as other user's annotation were not selected
        $mock->shouldReceive('put')
            ->once()
            ->with("{$u->firstname} {$u->lastname}");

        $mock->shouldReceive('put')
            ->once()
            ->with("{$u2->firstname} {$u2->lastname}");

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $childchild->name, $root2->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $childchild->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 1, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 1]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'separateUsers' => true,
            'aggregateChildLabels' => true,
            'onlyLabels' => [$childchild->id, $root2->id]
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
        // Empty images should be included in the report
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
            'allLabels' => true
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportAllLabels()
    {
        $volume = VolumeTest::create();
        $project = ProjectTest::create();
        $project->addVolumeId($volume);

        $lt = LabelTreeTest::create();
        $lt->projects()->attach($project);

        $root = LabelTest::create(['label_tree_id' => $lt->id]);
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $root->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i1->id])->id,
            'label_id' => $root->id,
        ]);

        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $i2->id])->id,
            'label_id' => $child->id,
        ]);

        $root2 = LabelTest::create(['label_tree_id' => $lt->id]);

        $a = ImageAnnotationTest::create(['image_id' => $i2->id]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'label_id' => $root->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'label_id' => $root->id,
        ]);

        // Empty images should be included in the report
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
                $root2->name,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['a.jpg', 2, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['b.jpg', 2, 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['c.jpg', 0, 0, 0]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'allLabels' => true
        ]);
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportAllLabelsRestrictToAnnotationSession()
    {
        $volume = VolumeTest::create();
        $project = ProjectTest::create();
        $project->addVolumeId($volume);

        $lt = LabelTreeTest::create();
        $lt->projects()->attach($project);

        $l1 = LabelTest::create(['label_tree_id' => $lt->id]);
        $l2 = LabelTest::create(['label_tree_id' => $lt->id]);
        // Empty label should be included in report
        $l3 = LabelTest::create(['label_tree_id' => $lt->id]);

        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        // Empty images should be included in the report
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $i1->id,
                'created_at' => '2016-10-04',
            ])->id,
            'label_id' => $l1->id,
            'user_id' => $user->id
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $i2->id,
                'created_at' => '2016-10-05',
            ])->id,
            'label_id' => $l2->id,
            'user_id' => $user->id
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with($volume->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                'image_filename',
                $l1->name,
                $l2->name,
                $l3->name,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['a.jpg', 0, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['b.jpg', 0, 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['c.jpg', 0, 0, 0]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new AbundanceReportGenerator([
            'allLabels' => true,
            'annotationSession' => $session->id
        ]);
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testInitQuery()
    {
        $image = ImageTest::create([
            'filename' => 'a.jpg',
        ]);

        // Empty images should be included in the report
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $image->volume_id
        ]);

        $a = ImageAnnotationTest::create(['image_id' => $image]);
        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a,
        ]);

        $generator = new AbundanceReportGenerator;

        $generator->setSource($image->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(2, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($al->id, $results[0]->id);
        $this->assertNull($results[1]->id);
    }

    public function testInitQueryAnnotationWithMultipleLabels()
    {
        $image = ImageTest::create([
            'filename' => 'a.jpg',
        ]);

        $a = ImageAnnotationTest::create(['image_id' => $image]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a,
        ]);

        $generator = new AbundanceReportGenerator();

        $generator->setSource($image->volume);
        $results = $generator->initQuery(['images.filename', 'labels.id'])->get();
        $this->assertCount(2, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image->filename, $results[1]->filename);
        $this->assertSame($al1->label_id, $results[0]->id);
        $this->assertSame($al2->label_id, $results[1]->id);
    }

    public function testInitQueryDuplicatedRecords()
    {
        $image = ImageTest::create([
            'filename' => 'a.jpg',
        ]);

        // Use this id to deselect both annotation labels
        $labelId = -1;

        $a = ImageAnnotationTest::create(['image_id' => $image]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a,
        ]);

        $generator = new AbundanceReportGenerator([
            'onlyLabels' => [$labelId]
        ]);

        $generator->setSource($image->volume);
        $results = $generator->initQuery(['images.filename', 'labels.id'])->get();
        // Duplicate null records will be reduced to one record
        $this->assertCount(1, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertNull($results[0]->id);
    }

    public function testInitQuerySeparateLabelTrees()
    {
        $image = ImageTest::create([
            'filename' => 'a.jpg',
        ]);

        // Empty images should be included in the report
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $image->volume_id
        ]);

        $a = ImageAnnotationTest::create(['image_id' => $image]);
        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a,
        ]);

        $generator = new AbundanceReportGenerator([
            'separateLabelTrees' => true
        ]);

        $generator->setSource($image->volume);
        $results = $generator->initQuery(['images.filename'])->get();
        $this->assertCount(2, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($al->label->label_tree_id, $results[0]->label_tree_id);
        $this->assertNull($results[1]->label_tree_id);
    }

    public function testInitQuerySeparateUser()
    {
        $image = ImageTest::create([
            'filename' => 'a.jpg',
        ]);

        // Empty images should be included in the report
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $image->volume_id
        ]);

        $a = ImageAnnotationTest::create(['image_id' => $image]);
        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a,
        ]);

        $generator = new AbundanceReportGenerator([
            'separateUsers' => true
        ]);

        $generator->setSource($image->volume);
        $results = $generator->initQuery(['images.filename'])->get();
        $this->assertCount(2, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($al->user_id, $results[0]->user_id);
        $this->assertNull($results[1]->user_id);
    }

    public function testInitQueryAnnotationSession()
    {
        $user = UserTest::create();
        $volume = VolumeTest::create();

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume
        ]);

        // Empty images should be included
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume
        ]);

        // Images without selected labels should be included
        $image3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $volume
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $session->users()->attach($user);

        // Annotation was created before the session
        $a1 = ImageAnnotationTest::create([
            'created_at' => '2016-10-04',
            'image_id' => $image,
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image,
            'created_at' => '2016-10-05',
        ]);

        $al = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
        ]);

        // Annotation does not belong to the session
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
        ]);

        // Annotation from another user
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
        ]);

        // Annotation was created after session
        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image2,
                'created_at' => '2016-10-07',
            ])->id,
            'user_id' => $user->id,
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
        ]);

        $generator->setSource($session->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($image3->filename, $results[2]->filename);
        $this->assertSame($al->id, $results[0]->id);
        $this->assertNull($results[1]->id);
        $this->assertNull($results[2]->id);
    }

    public function testInitQueryRestrictToNewestLabelQuery()
    {
        $image = ImageTest::create([
            'filename' => 'a.jpg',
        ]);

        // Empty images should be included
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $image->volume->id
        ]);

        $a = ImageAnnotationTest::create(['image_id' => $image]);

        $al1 = ImageAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:15:00',
            'annotation_id' => $a->id,
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = ImageAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $al3 = ImageAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $generator = new AbundanceReportGenerator([
            'newestLabel' => true,
        ]);
        $generator->setSource($a->image->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(2, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($al3->id, $results[0]->id);
        $this->assertNull($results[1]->id);
    }

    public function testInitQueryRestrictToLabels()
    {
        $image = ImageTest::create([
            'filename' => 'a.jpg',
        ]);

        // Images without selected labels should be included
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $image->volume_id
        ]);

        // Empty images should be included
        $image3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $image->volume_id
        ]);

        $a1 = ImageAnnotationTest::create(['image_id' => $image]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image2]);


        $al1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id]);

        // Label was not selected
        $al2 = ImageAnnotationLabelTest::create(['annotation_id' => $a2->id]);

        $generator = new AbundanceReportGenerator([
            'onlyLabels' => [$al1->label_id],
        ]);
        $generator->setSource($a1->image->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($image3->filename, $results[2]->filename);
        $this->assertSame($al1->id, $results[0]->id);
        $this->assertNull($results[1]->id);
        $this->assertNull($results[2]->id);
    }

    public function testInitQueryAnnotationSessionNewestLabelRestrictedLabel()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;
        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume->id
        ]);

        // Images without selected labels should be included
        $image3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $volume->id
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume->id
        ]);

        $session->users()->attach($userId);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-10-05 09:15:00',
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $userId,
            'created_at' => '2016-10-05 09:14:00',
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $userId,
        ]);

        // Label was not selected
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Label was not selected
        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image3->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Annotation was created before session
        $al5 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Annotation was created before session
        $al6 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image3->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
            'newestLabel' => true,
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al5->label_id, $al6->label_id]
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($image3->filename, $results[2]->filename);
        $this->assertSame($al2->id, $results[0]->id);
        $this->assertNull($results[1]->id);
        $this->assertNull($results[2]->id);
    }

    public function testInitQueryAnnotationSessionNewestLabel()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;
        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume->id
        ]);

        // Images without selected labels should be included
        $image3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $volume->id
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume->id
        ]);

        $session->users()->attach($userId);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-10-05 09:15:00',
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $userId,
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $userId,
        ]);

        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Annotation was created before session
        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image3->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Annotation was created before session
        $al5 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
            'newestLabel' => true,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(4, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image->filename, $results[1]->filename);
        $this->assertSame($image2->filename, $results[2]->filename);
        $this->assertSame($image3->filename, $results[3]->filename);
        $this->assertSame($al2->id, $results[0]->id);
        $this->assertSame($al3->id, $results[1]->id);
        $this->assertNull($results[2]->id);
        $this->assertNull($results[3]->id);
    }

    public function testInitQueryAnnotationSessionRestrictedLabel()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;
        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume->id
        ]);

        // Images without selected labels should be included
        $image3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $volume->id
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume->id
        ]);

        $session->users()->attach($userId);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ]),
            'user_id' => $userId,
        ]);

        // Label was not selected
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Annotation was created from other user
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
        ]);

        // Annotation was created before session
        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Label was not selected
        $al5 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image3->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
            'onlyLabels' => [$al1->label_id, $al3->label_id, $al4->label_id]
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($image3->filename, $results[2]->filename);
        $this->assertSame($al1->id, $results[0]->id);
        $this->assertNull($results[1]->id);
        $this->assertNull($results[2]->id);
    }

    public function testInitQueryNewestLabelRestrictedLabel()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume->id
        ]);

        // Images without selected labels should be included
        $image3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $volume->id
        ]);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]);

        // Label was not selected
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image->id, ])->id,
        ]);

        // Label was not selected
        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image3->id, ])->id,
        ]);

        $generator = new AbundanceReportGenerator([
            'newestLabel' => true,
            'onlyLabels' => [$al1->label_id, $al2->label_id]
        ]);
        $generator->setSource($volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($image3->filename, $results[2]->filename);
        $this->assertSame($al2->id, $results[0]->id);
        $this->assertNull($results[1]->id);
        $this->assertNull($results[2]->id);
    }

    public function testInitQueryRestrictToExportAreaQuery()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        array_map(function ($a) {
            ImageAnnotationLabelTest::create(['annotation_id' => $a->id]);
        }, $annotations);

        $emptyAnnotationId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $inside = [$annotations[0]->id, $annotations[1]->id, $annotations[4]->id, $emptyAnnotationId];
        $outside = [$annotations[2]->id, $annotations[3]->id, $annotations[5]->id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotations.id as annotation_id'])->get();
        $ids = $res->pluck('annotation_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyAnnotation = $res->last()->toArray();

        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);
        $this->assertSame(['id' => $image2->id, 'annotation_id' => null], $emptyAnnotation);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testInitQueryRestrictToExportAreaQueryAnnotationSession()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        array_map(function ($a) use ($user) {
            ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
                'user_id' => $user->id,
            ]);
        }, $annotations);

        $emptyAnnotationId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $expectedAnnotations = [$annotations[0]->id, $annotations[4]->id, $emptyAnnotationId];
        $outside = [$annotations[1]->id, $annotations[2]->id, $annotations[3]->id, $annotations[5]->id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotations.id as annotation_id'])->get();
        $ids = $res->pluck('annotation_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyAnnotation = $res->last()->toArray();

        sort($expectedAnnotations);
        sort($ids);

        $this->assertSame($expectedAnnotations, $ids);
        $this->assertSame(['id' => $image2->id, 'annotation_id' => null], $emptyAnnotation);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testInitQueryRestrictToExportAreaQueryAnnotationSessionRestrictToNewestLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        $labels = array_map(function ($a) use ($user) {
            return ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
                'user_id' => $user->id,
            ]);
        }, $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'user_id' => $user->id,
            'created_at' => '2025-10-5',
        ]);

        $emptyLabelId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $expectedLabels = [$newestLabel->label_id, $labels[4]->label_id, $emptyLabelId];
        $outside = [$labels[0]->label_id, $labels[1]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id,
            'newestLabel' => true
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyLabel = $res->last()->toArray();

        sort($expectedLabels);
        sort($ids);

        $this->assertSame($expectedLabels, $ids);
        $this->assertSame(['id' => $image2->id, 'label_id' => null], $emptyLabel);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testInitQueryRestrictToExportAreaQueryAnnotationSessionRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        $labels = array_map(function ($a) use ($user) {
            return ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
                'user_id' => $user->id,
            ]);
        }, $annotations);

        $emptyLabelId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $expectedLabels = [$labels[0]->label_id, $labels[4]->label_id, $emptyLabelId];
        $outside = [$labels[1]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id,
            'onlyLabels' => [$labels[0]->label_id, $labels[1]->label_id, $labels[4]->label_id] // $labels[1] should be ignored
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyLabel = $res->last()->toArray();

        sort($expectedLabels);
        sort($ids);

        $this->assertSame($expectedLabels, $ids);
        $this->assertSame(['id' => $image2->id, 'label_id' => null], $emptyLabel);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testInitQueryRestrictToExportAreaQueryRestrictToNewestLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        $labels = array_map(function ($a) {
            return ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
            ]);
        }, $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'created_at' => '2025-10-5',
        ]);

        $emptyLabelId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $expectedLabels = [$newestLabel->label_id, $labels[1]->label_id, $labels[4]->label_id, $emptyLabelId];
        $outside = [$labels[0]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
            'newestLabel' => true
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyLabel = $res->last()->toArray();

        sort($expectedLabels);
        sort($ids);

        $this->assertSame($expectedLabels, $ids);
        $this->assertSame(['id' => $image2->id, 'label_id' => null], $emptyLabel);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testInitQueryRestrictToExportAreaQueryRestrictToNewestLabelsRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        $labels = array_map(function ($a) {
            return ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
            ]);
        }, $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'created_at' => '2025-10-5',
        ]);

        $emptyLabelId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $expectedLabels = [$newestLabel->label_id, $labels[1]->label_id, $emptyLabelId];
        $outside = [$labels[0]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[4]->label_id, $labels[5]->label_id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
            'newestLabel' => true,
            'onlyLabels' => [$newestLabel->label_id, $labels[1]->label_id]
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyLabel = $res->last()->toArray();

        sort($expectedLabels);
        sort($ids);

        $this->assertSame($expectedLabels, $ids);
        $this->assertSame(['id' => $image2->id, 'label_id' => null], $emptyLabel);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testInitQueryRestrictToExportAreaQueryRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        $labels = array_map(function ($a) {
            return ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
            ]);
        }, $annotations);

        $emptyLabelId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $expectedLabels = [$labels[1]->label_id, $labels[4]->label_id, $emptyLabelId];
        $outside = [$labels[0]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
            'onlyLabels' => [$labels[1]->label_id, $labels[4]->label_id]
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyLabel = $res->last()->toArray();

        sort($expectedLabels);
        sort($ids);

        $this->assertSame($expectedLabels, $ids);
        $this->assertSame(['id' => $image2->id, 'label_id' => null], $emptyLabel);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testInitQueryRestrictToExportAreaQueryAnnotationSessionRestrictToNewestLabelsRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '2.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        $labels = array_map(function ($a) use ($user) {
            return ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
                'user_id' => $user->id
            ]);
        }, $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'created_at' => '2025-10-5',
            'user_id' => $user->id
        ]);

        $emptyLabelId = 0; // The empty image's annotation_id and label_id will be set to null (and later converted to 0)

        $expectedLabels = [$newestLabel->label_id, $labels[4]->label_id, $emptyLabelId];
        $outside = [$labels[0]->label_id, $labels[1]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AbundanceReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id,
            'onlyLabels' => [$labels[0]->label_id, $newestLabel->label_id, $labels[1]->label_id, $labels[4]->label_id], // $labels[0] and $labels[1] should be ignored
            'newestLabel' => true
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);
        $emptyLabel = $res->last()->toArray();

        sort($expectedLabels);
        sort($ids);

        $this->assertSame($expectedLabels, $ids);
        $this->assertSame(['id' => $image2->id, 'label_id' => null], $emptyLabel);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }
}
