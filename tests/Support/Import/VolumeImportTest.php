<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\MediaType;
use Biigle\Modules\Sync\Jobs\PostprocessVolumeImport;
use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Biigle\User;
use Biigle\Volume;
use Exception;
use File;
use Queue;
use Ramsey\Uuid\Uuid;
use Storage;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use TestCase;
use ZipArchive;

class VolumeImportTest extends TestCase
{
    protected $destination;

    public function setUp(): void
    {
        parent::setUp();
        $this->imageVolume = VolumeTest::create(['attrs' => ['ab' => 'cd']]);
        $this->image = ImageTest::create(['volume_id' => $this->imageVolume->id]);
        $this->videoVolume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $this->video = VideoTest::create(['volume_id' => $this->videoVolume->id]);
    }

    public function tearDown(): void
    {
        File::deleteDirectory($this->destination);
        parent::tearDown();
    }

    public function testFilesMatch()
    {
        $import = $this->getDefaultImport();

        $this->assertTrue($import->filesMatch());
        File::move("{$this->destination}/volumes.json", "{$this->destination}/volumes.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/volumes.doge", "{$this->destination}/volumes.json");
        File::move("{$this->destination}/label_trees.json", "{$this->destination}/label_trees.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/label_trees.doge", "{$this->destination}/label_trees.json");
        File::move("{$this->destination}/users.json", "{$this->destination}/users.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/users.doge", "{$this->destination}/users.json");
        File::move("{$this->destination}/images.csv", "{$this->destination}/images.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/images.doge", "{$this->destination}/images.csv");
        File::move("{$this->destination}/image_annotations.csv", "{$this->destination}/image_annotations.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/image_annotations.doge", "{$this->destination}/image_annotations.csv");
        File::move("{$this->destination}/image_annotation_labels.csv", "{$this->destination}/image_annotation_labels.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/image_annotation_labels.doge", "{$this->destination}/image_annotation_labels.csv");
        File::move("{$this->destination}/image_labels.csv", "{$this->destination}/image_labels.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/image_labels.doge", "{$this->destination}/image_labels.csv");
        File::move("{$this->destination}/videos.csv", "{$this->destination}/videos.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/videos.doge", "{$this->destination}/videos.csv");
        File::move("{$this->destination}/video_annotations.csv", "{$this->destination}/video_annotations.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/video_annotations.doge", "{$this->destination}/video_annotations.csv");
        File::move("{$this->destination}/video_annotation_labels.csv", "{$this->destination}/video_annotation_labels.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/video_annotation_labels.doge", "{$this->destination}/video_annotation_labels.csv");
        File::move("{$this->destination}/video_labels.csv", "{$this->destination}/video_labels.doge");
        $this->assertFalse($import->filesMatch());
    }

    public function testValidateFiles()
    {
        $import = $this->getDefaultImport();
        $import->validateFiles();

        $content = json_decode(File::get("{$this->destination}/volumes.json"), true);
        unset($content[0]['url']);
        File::put("{$this->destination}/volumes.json", json_encode($content));

        try {
            $import->validateFiles();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('are missing keys: url', $e->getMessage());
        }
    }

    public function testGetImportVolumes()
    {
        $import = $this->getDefaultImport();
        $volumes = $import->getImportVolumes()->pluck('name');
        $this->assertCount(2, $volumes);
        $this->assertContains($this->imageVolume->name, $volumes);
        $this->assertContains($this->videoVolume->name, $volumes);
    }

    public function testGetImportLabelTreesImages()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $trees = $import->getImportLabelTrees();
        $this->assertCount(1, $trees);
        $this->assertEquals($imageLabel->label->tree->uuid, $trees[0]['uuid']);
    }

    public function testGetImportLabelTreesVideos()
    {
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $import = $this->getDefaultImport();
        $trees = $import->getImportLabelTrees();
        $this->assertCount(1, $trees);
        $this->assertEquals($videoLabel->label->tree->uuid, $trees[0]['uuid']);
    }

    public function testGetVolumeImportCandidates()
    {
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertCount(2, $volumes);
        $this->assertEquals($this->imageVolume->name, $volumes[0]['name']);
        $this->assertEquals([], $volumes[0]['users']);
        $this->assertEquals([], $volumes[0]['label_trees']);
        $this->assertEquals([], $volumes[0]['labels']);
        $this->assertEquals($this->videoVolume->name, $volumes[1]['name']);
        $this->assertEquals([], $volumes[1]['users']);
        $this->assertEquals([], $volumes[1]['label_trees']);
        $this->assertEquals([], $volumes[1]['labels']);
    }

    public function testGetVolumeImportCandidatesImageAnnotationLabelTree()
    {
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $tree = $annotationLabel->label->tree;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'image');
        $this->assertEquals($tree->id, $volume['label_trees'][0]);
    }

    public function testGetVolumeImportCandidatesVideoAnnotationLabelTree()
    {
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => VideoAnnotationTest::create(['video_id' => $this->video->id])->id,
        ]);
        $tree = $annotationLabel->label->tree;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'video');
        $this->assertEquals($tree->id, $volume['label_trees'][0]);
    }

    public function testGetVolumeImportCandidatesImageAnnotationLabelLabel()
    {
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $label = $annotationLabel->label;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'image');
        $this->assertEquals($label->id, $volume['labels'][0]);
    }

    public function testGetVolumeImportCandidatesVideoAnnotationLabelLabel()
    {
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => VideoAnnotationTest::create(['video_id' => $this->video->id])->id,
        ]);
        $label = $annotationLabel->label;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'video');
        $this->assertEquals($label->id, $volume['labels'][0]);
    }

    public function testGetVolumeImportCandidatesImageAnnotationLabelUser()
    {
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $user = $annotationLabel->user;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'image');
        $this->assertEquals($user->id, $volume['users'][0]);
    }

    public function testGetVolumeImportCandidatesVideoAnnotationLabelUser()
    {
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => VideoAnnotationTest::create(['video_id' => $this->video->id])->id,
        ]);
        $user = $annotationLabel->user;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'video');
        $this->assertEquals($user->id, $volume['users'][0]);
    }

    public function testGetVolumeImportCandidatesImageLabelTree()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $tree = $imageLabel->label->tree;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'image');
        $this->assertEquals($tree->id, $volume['label_trees'][0]);
    }

    public function testGetVolumeImportCandidatesVideoLabelTree()
    {
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $tree = $videoLabel->label->tree;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'video');
        $this->assertEquals($tree->id, $volume['label_trees'][0]);
    }

    public function testGetVolumeImportCandidatesImageLabelLabel()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $label = $imageLabel->label;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'image');
        $this->assertEquals($label->id, $volume['labels'][0]);
    }

    public function testGetVolumeImportCandidatesVideoLabelLabel()
    {
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $label = $videoLabel->label;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'video');
        $this->assertEquals($label->id, $volume['labels'][0]);
    }

    public function testGetVolumeImportCandidatesImageLabelUser()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $user = $imageLabel->user;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'image');
        $this->assertEquals($user->id, $volume['users'][0]);
    }

    public function testGetVolumeImportCandidatesVideoLabelUser()
    {
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $user = $videoLabel->user;
        $import = $this->getDefaultImport();
        $volume = $import->getVolumeImportCandidates()->firstWhere('media_type_name', 'video');
        $this->assertEquals($user->id, $volume['users'][0]);
    }

    public function testGetUserImportCandidatesLabelTree()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $tree = $imageLabel->label->tree;
        $admin = UserTest::create();
        $tree->addMember($admin, Role::admin());
        $editor = UserTest::create();
        $tree->addMember($editor, Role::editor());

        $import = $this->getDefaultImport();
        $imageLabel->delete();
        $tree->delete();

        $users = $import->getUserImportCandidates();
        $this->assertCount(0, $users);

        $admin->delete();
        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $this->assertEquals($admin->uuid, $users[0]['uuid']);
    }

    public function testGetUserImportCandidatesImageAnnotationLabel()
    {
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $import = $this->getDefaultImport();
        $users = $import->getUserImportCandidates();
        $this->assertCount(0, $users);
        $uuid = $annotationLabel->user->fresh()->uuid;
        $annotationLabel->user->delete();
        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $this->assertEquals($uuid, $users[0]['uuid']);
    }

    public function testGetUserImportCandidatesVideoAnnotationLabel()
    {
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => VideoAnnotationTest::create(['video_id' => $this->video->id])->id,
        ]);
        $import = $this->getDefaultImport();
        $users = $import->getUserImportCandidates();
        $this->assertCount(0, $users);
        $uuid = $annotationLabel->user->fresh()->uuid;
        $annotationLabel->user->delete();
        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $this->assertEquals($uuid, $users[0]['uuid']);
    }

    public function testGetUserImportCandidatesImageLabel()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $users = $import->getUserImportCandidates();
        $this->assertCount(0, $users);
        $uuid = $imageLabel->user->fresh()->uuid;
        $imageLabel->user->delete();
        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $this->assertEquals($uuid, $users[0]['uuid']);
    }

    public function testGetUserImportCandidatesVideoLabel()
    {
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $import = $this->getDefaultImport();
        $users = $import->getUserImportCandidates();
        $this->assertCount(0, $users);
        $uuid = $videoLabel->user->fresh()->uuid;
        $videoLabel->user->delete();
        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $this->assertEquals($uuid, $users[0]['uuid']);
    }

    public function testGetLabelTreeImportCandidatesNothing()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $this->assertCount(0, $import->getLabelTreeImportCandidates());
    }

    public function testGetLabelTreeImportCandidatesImageAnnotationLabel()
    {
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $import = $this->getDefaultImport();
        $tree = $annotationLabel->label->tree;
        $annotationLabel->delete();
        $tree->delete();
        $trees = $import->getLabelTreeImportCandidates();
        $this->assertCount(1, $trees);
        $this->assertEquals($tree->uuid, $trees[0]['uuid']);
    }

    public function testGetLabelTreeImportCandidatesVideoAnnotationLabel()
    {
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => VideoAnnotationTest::create(['video_id' => $this->video->id])->id,
        ]);
        $import = $this->getDefaultImport();
        $tree = $annotationLabel->label->tree;
        $annotationLabel->delete();
        $tree->delete();
        $trees = $import->getLabelTreeImportCandidates();
        $this->assertCount(1, $trees);
        $this->assertEquals($tree->uuid, $trees[0]['uuid']);
    }

    public function testGetLabelTreeImportCandidatesImageLabel()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $tree = $imageLabel->label->tree;
        $imageLabel->delete();
        $tree->delete();
        $trees = $import->getLabelTreeImportCandidates();
        $this->assertCount(1, $trees);
        $this->assertEquals($tree->uuid, $trees[0]['uuid']);
    }

    public function testGetLabelTreeImportCandidatesVideoLabel()
    {
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $import = $this->getDefaultImport();
        $tree = $videoLabel->label->tree;
        $videoLabel->delete();
        $tree->delete();
        $trees = $import->getLabelTreeImportCandidates();
        $this->assertCount(1, $trees);
        $this->assertEquals($tree->uuid, $trees[0]['uuid']);
    }

    public function testGetLabelImportCandidatesNothing()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $this->assertCount(0, $import->getLabelImportCandidates());
    }

    public function testGetLabelImportCandidatesImageAnnotationLabel()
    {
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $import = $this->getDefaultImport();
        $label = $annotationLabel->label;
        $annotationLabel->delete();
        $label->delete();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals($label->uuid, $labels[0]['uuid']);
    }

    public function testGetLabelImportCandidatesVideoAnnotationLabel()
    {
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => VideoAnnotationTest::create(['video_id' => $this->video->id])->id,
        ]);
        $import = $this->getDefaultImport();
        $label = $annotationLabel->label;
        $annotationLabel->delete();
        $label->delete();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals($label->uuid, $labels[0]['uuid']);
    }

    public function testGetLabelImportCandidatesImageLabel()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $label = $imageLabel->label;
        $imageLabel->delete();
        $label->delete();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals($label->uuid, $labels[0]['uuid']);
    }

    public function testGetLabelImportCandidatesVideoLabel()
    {
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $import = $this->getDefaultImport();
        $label = $videoLabel->label;
        $videoLabel->delete();
        $label->delete();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals($label->uuid, $labels[0]['uuid']);
    }

    public function testGetLabelImportCandidatesConflict()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $label = $imageLabel->label;
        $label->name = 'conflicting name';
        $label->save();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals('conflicting name', $labels[0]['conflicting_name']);
    }

    public function testPerform()
    {
        $imageAnnotation = ImageAnnotationTest::create(['image_id' => $this->image->id]);
        $imageAnnotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $imageAnnotation->id,
        ]);
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);

        $videoAnnotation = VideoAnnotationTest::create(['video_id' => $this->video->id]);
        $videoAnnotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $videoAnnotation->id,
        ]);
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);

        $volume2 = VolumeTest::create();
        $import = $this->getImport([
            $this->imageVolume->id,
            $this->videoVolume->id,
            $volume2->id,
        ]);
        $project = ProjectTest::create();

        $map = $import->perform($project, $project->creator);

        $this->assertArrayHasKey('volumes', $map);
        $this->assertCount(3, $map['volumes']);
        $this->assertArrayHasKey($this->imageVolume->id, $map['volumes']);
        $this->assertArrayHasKey($this->videoVolume->id, $map['volumes']);
        $this->assertArrayHasKey($volume2->id, $map['volumes']);
        $this->assertEquals(2, $project->imageVolumes()->count());
        $this->assertEquals(1, $project->videoVolumes()->count());

        $newImageVolume = Volume::find($map['volumes'][$this->imageVolume->id]);
        $this->assertEquals($this->imageVolume->name, $newImageVolume->name);
        $this->assertEquals($this->imageVolume->url, $newImageVolume->url);
        $this->assertEquals($project->creator->id, $newImageVolume->creator_id);
        $this->assertEquals(MediaType::imageId(), $newImageVolume->media_type_id);
        $this->assertEquals(['ab' => 'cd'], $newImageVolume->attrs);

        $newImages = $newImageVolume->images;
        $this->assertCount(1, $newImages);
        $this->assertEquals($this->image->filename, $newImages[0]->filename);

        $newImageLabels = $newImages[0]->labels;
        $this->assertCount(1, $newImageLabels);
        $this->assertEquals($imageLabel->label->name, $newImageLabels[0]->label->name);

        $newImageAnnotations = $newImages[0]->annotations;
        $this->assertCount(1, $newImageAnnotations);
        $this->assertEquals($imageAnnotation->points, $newImageAnnotations[0]->points);

        $newImageAnnotationLabels = $newImageAnnotations[0]->labels;
        $this->assertCount(1, $newImageAnnotationLabels);
        $this->assertEquals($imageAnnotationLabel->label->name, $newImageAnnotationLabels[0]->label->name);

        $newVideoVolume = Volume::find($map['volumes'][$this->videoVolume->id]);
        $this->assertEquals($this->videoVolume->name, $newVideoVolume->name);
        $this->assertEquals($this->videoVolume->url, $newVideoVolume->url);
        $this->assertEquals($project->creator->id, $newVideoVolume->creator_id);
        $this->assertEquals(MediaType::videoId(), $newVideoVolume->media_type_id);

        $newVideos = $newVideoVolume->videos;
        $this->assertCount(1, $newVideos);
        $this->assertEquals($this->video->filename, $newVideos[0]->filename);

        $newVideoLabels = $newVideos[0]->labels;
        $this->assertCount(1, $newVideoLabels);
        $this->assertEquals($videoLabel->label->name, $newVideoLabels[0]->label->name);

        $newVideoAnnotations = $newVideos[0]->annotations;
        $this->assertCount(1, $newVideoAnnotations);
        $this->assertEquals($videoAnnotation->points, $newVideoAnnotations[0]->points);
        $this->assertEquals($videoAnnotation->frames, $newVideoAnnotations[0]->frames);

        $newVideoAnnotationLabels = $newVideoAnnotations[0]->labels;
        $this->assertCount(1, $newVideoAnnotationLabels);
        $this->assertEquals($videoAnnotationLabel->label->name, $newVideoAnnotationLabels[0]->label->name);
    }

    public function testPerformOnly()
    {
        $project = ProjectTest::create();
        $volume2 = VolumeTest::create();
        $import = $this->getImport([$this->imageVolume->id, $volume2->id]);
        $map = $import->perform($project, $project->creator, [$this->imageVolume->id]);
        $this->assertCount(1, $map['volumes']);
        $this->assertEquals(1, $project->volumes()->count());
        $this->assertEquals($this->imageVolume->name, $project->volumes()->first()->name);
        $this->assertEquals($project->volumes()->first()->id, $map['volumes'][$this->imageVolume->id]);
    }

    public function testPerformLabelTree()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $tree = $imageLabel->label->tree;
        $parent = LabelTest::create(['label_tree_id' => $tree->id]);
        $imageLabel->label->parent_id = $parent->id;
        $imageLabel->label->save();
        $import = $this->getDefaultImport();
        $imageLabel->delete();
        $tree->delete();
        $map = $import->perform($project, $project->creator);
        $this->assertCount(1, $map['labelTrees']);
        $newTree = LabelTree::where('uuid', $tree->uuid)->first();
        $this->assertNotNull($tree);
        $this->assertEquals($newTree->id, $map['labelTrees'][$tree->id]);
        $this->assertEquals(2, $newTree->labels()->count());
    }

    public function testPerformVersionedLabelTree()
    {
        $version = LabelTreeVersionTest::create();
        LabelTest::create(['label_tree_id' => $version->labelTree->id]);
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $tree = $imageLabel->label->tree;
        $tree->version_id = $version->id;
        $tree->save();
        $parent = LabelTest::create(['label_tree_id' => $tree->id]);
        $imageLabel->label->parent_id = $parent->id;
        $imageLabel->label->save();
        $import = $this->getDefaultImport();
        $imageLabel->delete();
        $tree->delete();
        $version->labelTree->delete();
        $map = $import->perform($project, $project->creator);
        $this->assertCount(2, $map['labelTrees']);
        $newTree = LabelTree::where('uuid', $tree->uuid)->first();
        $this->assertNotNull($tree);
        $this->assertEquals($newTree->id, $map['labelTrees'][$tree->id]);
        $this->assertEquals(2, $newTree->labels()->count());
        $masterTree = LabelTree::where('uuid', $version->labelTree->uuid)->first();
        $this->assertEquals(1, $masterTree->labels()->count());
    }

    public function testPerformLabel()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $label = $imageLabel->label;
        $import = $this->getDefaultImport();
        $imageLabel->delete();
        $label->delete();
        $map = $import->perform($project, $project->creator);
        $this->assertCount(1, $map['labels']);
        $newLabel = Label::where('uuid', $label->uuid)->first();
        $this->assertNotNull($label);
        $this->assertEquals($newLabel->id, $map['labels'][$label->id]);
    }

    public function testPerformUrls()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('new-url');
        // Existence of a directory is checked via its contents so we need to create a
        // file here.
        Storage::disk('test')->put('new-url/fakeimage.jpg', '');
        $project = ProjectTest::create();
        $import = $this->getImport([$this->imageVolume->id]);
        $map = $import->perform($project, $project->creator, null, [
            $this->imageVolume->id => 'test://new-url',
        ]);
        $newVolume = $project->volumes()->first();
        $this->assertEquals('test://new-url', $newVolume->url);
    }

    public function testPerformInvalidUrls()
    {
        $project = ProjectTest::create();
        $volume2 = VolumeTest::create();
        $import = $this->getImport([$this->imageVolume->id, $volume2->id]);
        try {
            $map = $import->perform($project, $project->creator, null, [
                $volume2->id => 'test://not/existing',
            ]);
            $this->assertFalse(true);
        } catch (UnprocessableEntityHttpException $e) {
            $this->assertEquals(0, $project->volumes()->count());
        }
    }

    public function testPerformNameConflictUnresolved()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $label = $imageLabel->label;
        $import = $this->getDefaultImport();
        $label->name = 'new name';
        $label->save();
        try {
            $map = $import->perform($project, $project->creator);
            $this->assertFalse(true);
        } catch (UnprocessableEntityHttpException $e) {
            $this->assertStringContainsString('Unresolved name conflict', $e->getMessage());
        }
    }

    public function testPerformParentConflictUnresolved()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $label = $imageLabel->label;
        $import = $this->getDefaultImport();
        $label->parent_id = LabelTest::create(['label_tree_id' => $label->label_tree_id])->id;
        $label->save();
        try {
            $map = $import->perform($project, $project->creator);
            $this->assertFalse(true);
        } catch (UnprocessableEntityHttpException $e) {
            $this->assertStringContainsString('Unresolved parent conflict', $e->getMessage());
        }
    }

    public function testPerformUserImageAnnotationLabel()
    {
        $project = ProjectTest::create();
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $user = $annotationLabel->user->fresh();
        $import = $this->getDefaultImport();
        $user->delete();

        $map = $import->perform($project, $project->creator);
        $newUser = User::where('uuid', $user->uuid)->first();
        $this->assertNotNull($newUser);
        $this->assertEquals($newUser->id, $map['users'][$user->id]);
    }

    public function testPerformUserVideoAnnotationLabel()
    {
        $project = ProjectTest::create();
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => VideoAnnotationTest::create(['video_id' => $this->video->id])->id,
        ]);
        $user = $annotationLabel->user->fresh();
        $import = $this->getDefaultImport();
        $user->delete();

        $map = $import->perform($project, $project->creator);
        $newUser = User::where('uuid', $user->uuid)->first();
        $this->assertNotNull($newUser);
        $this->assertEquals($newUser->id, $map['users'][$user->id]);
    }

    public function testPerformUserImageLabel()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $user = $imageLabel->user->fresh();
        $import = $this->getDefaultImport();
        $user->delete();

        $map = $import->perform($project, $project->creator);
        $newUser = User::where('uuid', $user->uuid)->first();
        $this->assertNotNull($newUser);
        $this->assertEquals($newUser->id, $map['users'][$user->id]);
    }

    public function testPerformUserVideoLabel()
    {
        $project = ProjectTest::create();
        $videoLabel = VideoLabelTest::create(['video_id' => $this->video->id]);
        $user = $videoLabel->user->fresh();
        $import = $this->getDefaultImport();
        $user->delete();

        $map = $import->perform($project, $project->creator);
        $newUser = User::where('uuid', $user->uuid)->first();
        $this->assertNotNull($newUser);
        $this->assertEquals($newUser->id, $map['users'][$user->id]);
    }

    public function testPerformUserConflicts()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $user = $imageLabel->user->fresh();
        $import = $this->getDefaultImport();
        $user->uuid = Uuid::uuid4();
        $user->save();

        try {
            $map = $import->perform($project, $project->creator);
            $this->assertFalse(true);
        } catch (UnprocessableEntityHttpException $e) {
            $this->assertStringContainsString('UUIDs do not match', $e->getMessage());
        }

        $this->assertEquals(0, $project->volumes()->count());
        $this->assertEquals(2, Volume::count());
    }

    public function testPerformExceptionVolumes()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $import->throw = true;

        try {
            $map = $import->perform($project, $project->creator);
            $this->assertFalse(true);
        } catch (Exception $e) {
            //
        }

        $this->assertEquals(0, $project->volumes()->count());
        $this->assertEquals(2, Volume::count());
    }

    public function testPerformExceptionLabelTrees()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $import->throw = true;
        $tree = $imageLabel->label->tree;
        $imageLabel->delete();
        $tree->delete();

        try {
            $map = $import->perform($project, $project->creator);
            $this->assertFalse(true);
        } catch (Exception $e) {
            //
        }

        $this->assertEquals(0, LabelTree::count());
    }

    public function testPerformExceptionLabels()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $import->throw = true;
        $label = $imageLabel->label;
        $imageLabel->delete();
        $label->delete();

        try {
            $map = $import->perform($project, $project->creator);
            $this->assertFalse(true);
        } catch (Exception $e) {
            //
        }

        $this->assertEquals(0, Label::count());
    }

    public function testPerformExceptionUsers()
    {
        $project = ProjectTest::create();
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $import->throw = true;
        $user = $imageLabel->user->fresh();
        $imageLabel->delete();
        $user->delete();

        try {
            $map = $import->perform($project, $project->creator);
            $this->assertFalse(true);
        } catch (Exception $e) {
            //
        }

        $this->assertFalse(User::where('uuid', $user->uuid)->exists());
    }

    public function testPerformPostprocessJob()
    {
        $project = ProjectTest::create();
        $import = $this->getDefaultImport();
        $map = $import->perform($project, $project->creator);
        Queue::assertPushed(PostprocessVolumeImport::class);
    }

    protected function getDefaultImport()
    {
        return $this->getImport([$this->imageVolume->id, $this->videoVolume->id]);
    }

    protected function getImport(array $ids)
    {
        $export = new VolumeExport($ids);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'volume_import_test');
        // This should be a directory, not a file.
        File::delete($this->destination);

        $zip = new ZipArchive;
        $zip->open($path);
        $zip->extractTo($this->destination);
        $zip->close();

        return new VolumeImportStub($this->destination);
    }
}

class VolumeImportStub extends VolumeImport
{
    public $throw;

    protected function insertImages($volumeIdMap)
    {
        if ($this->throw) {
            throw new Exception('I threw up');
        }

        return parent::insertImages($volumeIdMap);
    }
}
