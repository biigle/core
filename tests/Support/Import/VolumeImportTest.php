<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use Queue;
use Storage;
use TestCase;
use Exception;
use ZipArchive;
use Biigle\User;
use Biigle\Role;
use Biigle\Label;
use Biigle\Volume;
use Ramsey\Uuid\Uuid;
use Biigle\LabelTree;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;
use Biigle\Modules\Sync\Jobs\PostprocessVolumeImport;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class VolumeImportTest extends TestCase
{
    protected $destination;

    public function setUp()
    {
        parent::setUp();
        $this->volume = VolumeTest::create(['attrs' => ['ab' => 'cd']]);
        $this->image = ImageTest::create(['volume_id' => $this->volume->id]);
    }

    public function tearDown()
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
        File::move("{$this->destination}/annotations.csv", "{$this->destination}/annotations.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/annotations.doge", "{$this->destination}/annotations.csv");
        File::move("{$this->destination}/annotation_labels.csv", "{$this->destination}/annotation_labels.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/annotation_labels.doge", "{$this->destination}/annotation_labels.csv");
        File::move("{$this->destination}/image_labels.csv", "{$this->destination}/image_labels.doge");
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
            $this->assertContains('are missing keys: url', $e->getMessage());
        }
    }

    public function testGetImportVolumes()
    {
        $import = $this->getDefaultImport();
        $volumes = $import->getImportVolumes();
        $this->assertCount(1, $volumes);
        $this->assertEquals($this->volume->name, $volumes[0]['name']);
    }

    public function testGetImportLabelTrees()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $trees = $import->getImportLabelTrees();
        $this->assertCount(1, $trees);
        $this->assertEquals($imageLabel->label->tree->uuid, $trees[0]['uuid']);
    }

    public function testGetVolumeImportCandidates()
    {
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertCount(1, $volumes);
        $this->assertEquals($this->volume->name, $volumes[0]['name']);
        $this->assertEquals([], $volumes[0]['users']);
        $this->assertEquals([], $volumes[0]['label_trees']);
        $this->assertEquals([], $volumes[0]['labels']);
    }

    public function testGetVolumeImportCandidatesAnnotationLabelTree()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $tree = $annotationLabel->label->tree;
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertEquals($tree->id, $volumes[0]['label_trees'][0]);
    }

    public function testGetVolumeImportCandidatesAnnotationLabelLabel()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $label = $annotationLabel->label;
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertEquals($label->id, $volumes[0]['labels'][0]);
    }

    public function testGetVolumeImportCandidatesAnnotationLabelUser()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $user = $annotationLabel->user;
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertEquals($user->id, $volumes[0]['users'][0]);
    }

    public function testGetVolumeImportCandidatesImageLabelTree()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $tree = $imageLabel->label->tree;
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertEquals($tree->id, $volumes[0]['label_trees'][0]);
    }

    public function testGetVolumeImportCandidatesImageLabelLabel()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $label = $imageLabel->label;
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertEquals($label->id, $volumes[0]['labels'][0]);
    }

    public function testGetVolumeImportCandidatesImageLabelUser()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $user = $imageLabel->user;
        $import = $this->getDefaultImport();
        $volumes = $import->getVolumeImportCandidates();
        $this->assertEquals($user->id, $volumes[0]['users'][0]);
    }

    public function testGetUserImportCandidatesLabelTree()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $tree = $imageLabel->label->tree;
        $admin = UserTest::create();
        $tree->addMember($admin, Role::$admin);
        $editor = UserTest::create();
        $tree->addMember($editor, Role::$editor);

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

    public function testGetUserImportCandidatesAnnotationLabel()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
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

    public function testGetLabelTreeImportCandidatesNothing()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $this->assertCount(0, $import->getLabelTreeImportCandidates());
    }

    public function testGetLabelTreeImportCandidatesAnnotationLabel()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
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

    public function testGetLabelImportCandidatesNothing()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $this->assertCount(0, $import->getLabelImportCandidates());
    }

    public function testGetLabelImportCandidatesAnnotationLabel()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
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
        $annotation = AnnotationTest::create(['image_id' => $this->image->id]);
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $volume2 = VolumeTest::create();
        $import = $this->getImport([$this->volume->id, $volume2->id]);
        $project = ProjectTest::create();

        $map = $import->perform($project, $project->creator);

        $this->assertArrayHasKey('volumes', $map);
        $this->assertCount(2, $map['volumes']);
        $this->assertArrayHasKey($this->volume->id, $map['volumes']);
        $this->assertArrayHasKey($volume2->id, $map['volumes']);
        $this->assertEquals(2, $project->volumes()->count());

        $newVolume = Volume::find($map['volumes'][$this->volume->id]);
        $this->assertEquals($this->volume->name, $newVolume->name);
        $this->assertEquals($this->volume->url, $newVolume->url);
        $this->assertEquals($project->creator->id, $newVolume->creator_id);
        $this->assertEquals(['ab' => 'cd'], $newVolume->attrs);

        $newImages = $newVolume->images;
        $this->assertCount(1, $newImages);
        $this->assertEquals($this->image->filename, $newImages[0]->filename);

        $newImageLabels = $newImages[0]->labels;
        $this->assertCount(1, $newImageLabels);
        $this->assertEquals($imageLabel->label->name, $newImageLabels[0]->label->name);

        $newAnnotations = $newImages[0]->annotations;
        $this->assertCount(1, $newAnnotations);
        $this->assertEquals($annotation->points, $newAnnotations[0]->points);

        $newAnnotationLabels = $newAnnotations[0]->labels;
        $this->assertCount(1, $newAnnotationLabels);
        $this->assertEquals($annotationLabel->label->name, $newAnnotationLabels[0]->label->name);
    }

    public function testPerformOnly()
    {
        $project = ProjectTest::create();
        $volume2 = VolumeTest::create();
        $import = $this->getImport([$this->volume->id, $volume2->id]);
        $map = $import->perform($project, $project->creator, [$this->volume->id]);
        $this->assertCount(1, $map['volumes']);
        $this->assertEquals(1, $project->volumes()->count());
        $this->assertEquals($this->volume->name, $project->volumes()->first()->name);
        $this->assertEquals($project->volumes()->first()->id, $map['volumes'][$this->volume->id]);
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
        $import = $this->getDefaultImport();
        $map = $import->perform($project, $project->creator, null, [
            $this->volume->id => 'test://new-url',
        ]);
        $newVolume = $project->volumes()->first();
        $this->assertEquals('test://new-url', $newVolume->url);
    }

    public function testPerformInvalidUrls()
    {
        $project = ProjectTest::create();
        $volume2 = VolumeTest::create();
        $import = $this->getImport([$this->volume->id, $volume2->id]);
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
            $this->assertContains('Unresolved name conflict', $e->getMessage());
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
            $this->assertContains('Unresolved parent conflict', $e->getMessage());
        }
    }

    public function testPerformUserAnnotationLabel()
    {
        $project = ProjectTest::create();
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
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
            $this->assertContains('UUIDs do not match', $e->getMessage());
        }

        $this->assertEquals(0, $project->volumes()->count());
        $this->assertEquals(1, Volume::count());
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
        $this->assertEquals(1, Volume::count());
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
        return $this->getImport([$this->volume->id]);
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
