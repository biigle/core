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
use Biigle\Tests\AnnotationSessionTest;
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

    public function testGenerateReportOnlyLabelsAggregateChildLabelsAllLabels()
    {
        $volume = VolumeTest::create();
        $project = ProjectTest::create();
        $project->addVolumeId($volume);
        $image = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        // Empty images should be included in the report
        $image2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        $lt = LabelTreeTest::create();
        $lt->projects()->attach($project);

        $root1 = LabelTest::create(['label_tree_id' => $lt->id]);
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

        $root5 = LabelTest::create(['label_tree_id' => $lt->id]);
        // Test case where the root label should be included but has no annotations.
        ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
            ])->id,
            'label_id' => $root5->id,
        ]);
        $root6 = LabelTest::create(['label_tree_id' => $lt->id]);
        $root7 = LabelTest::create(['label_tree_id' => $lt->id]);

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
                $root5->name,
                $root6->name,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image->filename, 2, 1, 1, 1, 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$image2->filename, 0, 0, 0, 0, 0, 0]);

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
                $root5->id,
                $root6->id
            ],
            'allLabels' => true
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
        $volume = VolumeTest::create();
        $project->addVolumeId($volume);
        $lt = LabelTreeTest::create();
        $lt2 = LabelTreeTest::create();
        $lt->projects()->attach($project);
        $lt2->projects()->attach($project);

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
            ->with(['image_filename', $root->name, $root2->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with(['image_filename', $root->name, $root2->name]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 1, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i1->filename, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 2, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i2->filename, 0, 0]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$i3->filename, 0, 0]);

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
        $results = $generator->initQuery(['images.filename', 'image_annotations.id'])->get();
        $this->assertCount(2, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($a->id, $results[0]->id);
        $this->assertNull($results[1]->id);
    }

    public function testInitQueryAnnotationSession()
    {
        $user = UserTest::create();
        $volume = VolumeTest::create();
        $project = ProjectTest::create();
        $project->addVolumeId($volume);
        $lt = LabelTreeTest::create();
        $lt->projects()->attach($project);

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume
        ]);

        // Images of excluded annotations should be included in the report
        $image2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume
        ]);

        // Empty images should be included in the report
        $image3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $volume
        ]);

        $l1 = LabelTest::create(['label_tree_id' => $lt]);
        $l2 = LabelTest::create(['label_tree_id' => $lt]);
        $l3 = LabelTest::create(['label_tree_id' => $lt]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $session->users()->attach($user);

        // Annotation was created before the session
        $a1 = ImageAnnotationTest::create([
            'created_at' => '2016-10-04',
            'image_id' => $image2,
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image,
            'created_at' => '2016-10-05',
        ]);

        // Annotation doesn't belong to the session
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l2->id
        ]);

        // Session user didn't create this annotation
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l3->id
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
        ]);

        $generator->setSource($session->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotations.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image2->filename, $results[1]->filename);
        $this->assertSame($image3->filename, $results[2]->filename);
        $this->assertSame($a2->id, $results[0]->id);
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
        $al1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id]);

        $a2 = ImageAnnotationTest::create(['image_id' => $image2]);
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

        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

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
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id, $al5->label_id]
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image->filename, $results[1]->filename);
        $this->assertSame($image2->filename, $results[2]->filename);
        $this->assertEquals($al2->id, $results[0]->id);
        $this->assertEquals($al4->id, $results[1]->id);
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

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
        $results = $generator->initQuery(['images.filename','image_annotation_labels.id'])->get();
        $this->assertCount(4, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image->filename, $results[1]->filename);
        $this->assertSame($image->filename, $results[2]->filename);
        $this->assertSame($image2->filename, $results[3]->filename);
        $this->assertEquals($al2->id, $results[0]->id);
        $this->assertEquals($al3->id, $results[1]->id);
        $this->assertEquals($al4->id, $results[2]->id);
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $al5 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id, $al5->label_id]
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(4, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image->filename, $results[1]->filename);
        $this->assertSame($image->filename, $results[2]->filename);
        $this->assertSame($image2->filename, $results[3]->filename);
        $this->assertEquals($al1->id, $results[0]->id);
        $this->assertEquals($al2->id, $results[1]->id);
        $this->assertEquals($al4->id, $results[2]->id);
        $this->assertNull($results[3]->id);
    }

    public function testInitQueryNewestLabelRestrictedLabel()
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

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
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
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image->id,])->id,
            'user_id' => $userId,
        ]);

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image->id,])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'newestLabel' => true,
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id]
        ]);
        $generator->setSource($volume);
        $results = $generator->initQuery(['images.filename', 'image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertSame($image->filename, $results[0]->filename);
        $this->assertSame($image->filename, $results[1]->filename);
        $this->assertSame($image2->filename, $results[2]->filename);
        $this->assertEquals($al2->id, $results[0]->id);
        $this->assertEquals($al4->id, $results[1]->id);
        $this->assertNull($results[2]->id);
    }

    public function testInitQueryAnnotationSessionNewestLabelRestrictedLabelSeparateLabelTrees()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

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
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id, $al5->label_id],
            'separateLabelTrees' => true
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(3, $results);
        $this->assertEquals($al2->label->label_tree_id, $results[0]->label_tree_id);
        $this->assertEquals($al4->label->label_tree_id, $results[1]->label_tree_id);
        $this->assertNull($results[2]->label_tree_id);
    }

    public function testInitQueryAnnotationSessionNewestLabelRestrictedLabelSeparateUser()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

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
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id, $al5->label_id],
            'separateUsers' => true
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(2, $results);
        $this->assertEquals($al2->user_id, $results[0]->user_id);
        $this->assertNull($results[1]->user_id);
    }

    public function testInitQueryAnnotationSessionNewestLabelSeparateLabelTree()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

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
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(4, $results);
        $this->assertEquals($al2->label->label_tree_id, $results[0]->label_tree_id);
        $this->assertEquals($al3->label->label_tree_id, $results[1]->label_tree_id);
        $this->assertEquals($al4->label->label_tree_id, $results[2]->label_tree_id);
        $this->assertNull($results[3]->label_tree_id);
    }

    public function testInitQueryAnnotationSessionNewestLabelSeparateUser()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

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
            'separateUsers' => true,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(2, $results);
        $this->assertEquals($userId, $results[0]->user_id);
        $this->assertNull( $results[1]->user_id);
    }

    public function testInitQueryAnnotationSessionRestrictedLabelSeparateLabelTrees()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $al5 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id, $al5->label_id],
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(4, $results);
        $this->assertEquals($al1->label->label_tree_id, $results[0]->label_tree_id);
        $this->assertEquals($al2->label->label_tree_id, $results[1]->label_tree_id);
        $this->assertEquals($al4->label->label_tree_id, $results[2]->label_tree_id);
        $this->assertNull($results[3]->label_tree_id);
    }

    public function testInitQueryAnnotationSessionRestrictedLabelSeparateUser()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
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

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $al5 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'annotationSession' => $session->id,
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id, $al5->label_id],
            'separateUsers' => true,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery([])->get();
        $this->assertCount(2, $results);
        $this->assertEquals($al1->user_id, $results[0]->user_id);
        $this->assertNull($results[1]->user_id);
    }

    public function testNewestLabelRestrictedLabelSeparateLabelTrees()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;

        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume->id
        ]);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
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
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image->id, ])->id,
            'user_id' => $userId,
        ]);

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image->id, ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'newestLabel' => true,
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id],
            'separateLabelTrees' => true
        ]);
        $generator->setSource($volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(3, $results);
        $this->assertEquals($al2->label->label_tree_id, $results[0]->label_tree_id);
        $this->assertEquals($al4->label->label_tree_id, $results[1]->label_tree_id);
        $this->assertNull($results[2]->label_tree_id);
    }

    public function testInitQueryNewestLabelRestrictedLabelSeparateUser()
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;
        
        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $volume->id
        ]);

        // Empty images should be included
        ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $volume->id
        ]);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
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
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image->id, ])->id,
            'user_id' => $userId,
        ]);

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $image->id, ])->id,
            'user_id' => $userId,
        ]);

        $generator = new AbundanceReportGenerator([
            'newestLabel' => true,
            'onlyLabels' => [$al1->label_id, $al2->label_id, $al4->label_id],
            'separateUsers' => true
        ]);
        $generator->setSource($volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(2, $results);
        $this->assertEquals($al2->user_id, $results[0]->user_id);
        $this->assertNull( $results[1]->user_id);
    }
}
