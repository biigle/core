<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\ImportVolumeMetadata;
use Biigle\Label as DbLabel;
use Biigle\LabelTree;
use Biigle\MediaType;
use Biigle\PendingVolume;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Services\MetadataParsing\VideoAnnotation;
use Biigle\Services\MetadataParsing\VideoMetadata;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Shape;
use Biigle\User as DbUser;
use Biigle\Visibility;
use Biigle\Volume;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;

class PendingVolumeImportControllerTest extends ApiTestCase
{
    public function testUpdateAnnotationLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;

        $this->doTestApiRoute('PUT', "/api/v1/pending-volumes/{$id}/annotation-labels");

        $this->beExpert();
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/annotation-labels")
            ->assertStatus(403);

        $this->beAdmin();
        // Label list required.
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/annotation-labels")
            ->assertStatus(422);

        // Label list must be filled.
        $this->putJson("/api/v1/pending-volumes/{$id}/annotation-labels", [
            'labels' => [],
        ])->assertStatus(422);

        // No volume attached yet.
        $this->putJson("/api/v1/pending-volumes/{$id}/annotation-labels", [
            'labels' => [123],
        ])->assertStatus(422);

        // Label not in metadata.
        $this->putJson("/api/v1/pending-volumes/{$id}/annotation-labels", [
            'labels' => [456],
        ])->assertStatus(422);

        $pv->update(['volume_id' => $this->volume()->id]);

        $this->putJson("/api/v1/pending-volumes/{$id}/annotation-labels", [
            'labels' => [123],
        ])->assertSuccessful();

        $pv->refresh();
        $this->assertEquals([123], $pv->only_annotation_labels);
    }

    public function testUpdateFileLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;

        $this->doTestApiRoute('PUT', "/api/v1/pending-volumes/{$id}/file-labels");

        $this->beExpert();
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/file-labels")
            ->assertStatus(403);

        $this->beAdmin();
        // Label list required.
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/file-labels")
            ->assertStatus(422);

        // Label list must be filled.
        $this->putJson("/api/v1/pending-volumes/{$id}/file-labels", [
            'labels' => [],
        ])->assertStatus(422);

        // No volume attached yet.
        $this->putJson("/api/v1/pending-volumes/{$id}/file-labels", [
            'labels' => [123],
        ])->assertStatus(422);

        $pv->update(['volume_id' => $this->volume()->id]);

        // Label not in metadata.
        $this->putJson("/api/v1/pending-volumes/{$id}/file-labels", [
            'labels' => [456],
        ])->assertStatus(422);

        $this->putJson("/api/v1/pending-volumes/{$id}/file-labels", [
            'labels' => [123],
        ])->assertSuccessful();

        $pv->refresh();
        $this->assertEquals([123], $pv->only_file_labels);
    }

    public function testUpdateLabelMap()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;

        $this->doTestApiRoute('PUT', "/api/v1/pending-volumes/{$id}/label-map");

        $this->beExpert();
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/label-map")
            ->assertStatus(403);

        $this->beAdmin();
        // Label map required.
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/label-map")
            ->assertStatus(422);

        // Label map must be filled.
        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [],
        ])->assertStatus(422);

        // No volume attached yet.
        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [123 => $this->labelRoot()->id],
        ])->assertStatus(422);

        $pv->update(['volume_id' => $this->volume()->id]);

        // Label not in metadata.
        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [456 => $this->labelRoot()->id],
        ])->assertStatus(422);

        // Label not in database.
        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [123 => -1],
        ])->assertStatus(422);

        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [123 => $this->labelRoot()->id],
        ])->assertSuccessful();

        $pv->refresh();
        $this->assertEquals([123 => $this->labelRoot()->id], $pv->label_map);
    }

    public function testUpdateLabelMapFileLabel()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
        ]);
        $id = $pv->id;

        $this->beAdmin();

        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [123 => $this->labelRoot()->id],
        ])->assertSuccessful();

        $pv->refresh();
        $this->assertEquals([123 => $this->labelRoot()->id], $pv->label_map);
    }

    public function testUpdateLabelMapTryIgnoredAnnotationLabel()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'only_annotation_labels' => [1],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [123 => $this->labelRoot()->id],
        ])->assertStatus(422);
    }

    public function testUpdateLabelMapTryIgnoredFileLabel()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'only_file_labels' => [1],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [123 => $this->labelRoot()->id],
        ])->assertStatus(422);
    }

    public function testUpdateLabelMapTryLabelNotAllowed()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
        ]);
        $id = $pv->id;

        // This label belongs to a label tree that is not accessible by the user.
        // The other tests use a label from a public label tree.
        $dbLabel = DbLabel::factory()->create([
            'label_tree_id' => LabelTree::factory()->create([
                'visibility_id' => Visibility::privateId(),
            ])->id,
        ]);

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}/label-map", [
            'label_map' => [123 => $dbLabel->id],
        ])->assertStatus(422);
    }

    public function testUpdateUserMap()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;

        $this->doTestApiRoute('PUT', "/api/v1/pending-volumes/{$id}/user-map");

        $this->beExpert();
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/user-map")
            ->assertStatus(403);

        $this->beAdmin();
        // User map required.
        $this
            ->putJson("/api/v1/pending-volumes/{$id}/user-map")
            ->assertStatus(422);

        // User map must be filled.
        $this->putJson("/api/v1/pending-volumes/{$id}/user-map", [
            'user_map' => [],
        ])->assertStatus(422);

        // No volume attached yet.
        $this->putJson("/api/v1/pending-volumes/{$id}/user-map", [
            'user_map' => [321 => $this->user()->id],
        ])->assertStatus(422);

        $pv->update(['volume_id' => $this->volume()->id]);

        // User not in metadata.
        $this->putJson("/api/v1/pending-volumes/{$id}/user-map", [
            'user_map' => [456 => $this->user()->id],
        ])->assertStatus(422);

        // User not in database.
        $this->putJson("/api/v1/pending-volumes/{$id}/user-map", [
            'user_map' => [321 => -1],
        ])->assertStatus(422);

        $this->putJson("/api/v1/pending-volumes/{$id}/user-map", [
            'user_map' => [321 => $this->user()->id],
        ])->assertSuccessful();

        $pv->refresh();
        $this->assertEquals([321 => $this->user()->id], $pv->user_map);
    }

    public function testUpdateUserMapFileLabel()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
        ]);
        $id = $pv->id;

        $this->beAdmin();

        $this->putJson("/api/v1/pending-volumes/{$id}/user-map", [
            'user_map' => [321 => $this->user()->id],
        ])->assertSuccessful();

        $pv->refresh();
        $this->assertEquals([321 => $this->user()->id], $pv->user_map);
    }

    public function testStoreImport()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
        ]);
        $id = $pv->id;

        $this->doTestApiRoute('POST', "/api/v1/pending-volumes/{$id}/import");

        $this->beExpert();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(403);

        $this->beAdmin();

        // No volume_id set.
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);

        $pv->update(['volume_id' => $this->volume()->id]);

        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertSuccessful();

        Queue::assertPushed(ImportVolumeMetadata::class, function ($job) use ($pv) {
            $this->assertEquals($pv->id, $job->pv->id);

            return true;
        });

        $this->assertTrue($pv->fresh()->importing);
    }

    public function testStoreImportNoImportAnnotationsSet()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
        $pv->update(['import_annotations' => true]);
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertSuccessful();
    }

    public function testStoreImportNoImportFileLabelsSet()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
        $pv->update(['import_file_labels' => true]);
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertSuccessful();
    }

    public function testStoreImportNoAnnotations()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_annotations' => true,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportNoAnnotationsAfterFiltering()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_annotations' => true,
            'only_annotation_labels' => [1],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportNoFileLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportNoFileLabelsAfterFiltering()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
            'only_file_labels' => [1],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportAlreadyImporting()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
            'importing' => true,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportMatchByUuid()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label', uuid: $dbLabel->uuid);
        $user = new User(321, 'joe user', uuid: $dbUser->uuid);
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertSuccessful();
    }

    public function testStoreImportUserNoMatch()
    {
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
            'label_map' => [123 => $dbLabel->id],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportLabelNoMatch()
    {
        $dbUser = DbUser::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
            'user_map' => [321 => $dbUser->id],
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportMatchOnlyWithAnnotationLabelFilter()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label1 = new Label(123, 'my label');
        $user1 = new User(321, 'joe user');
        $lau = new LabelAndUser($label1, $user1);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);
        $label2 = new Label(456, 'my label');
        $user2 = new User(654, 'joe user');
        $lau = new LabelAndUser($label2, $user2);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_annotations' => true,
            'only_annotation_labels' => [123],
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],

        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertSuccessful();
    }

    public function testStoreImportMatchOnlyWithFileLabelFilter()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label1 = new Label(123, 'my label');
        $user1 = new User(321, 'joe user');
        $lau = new LabelAndUser($label1, $user1);
        $file->addFileLabel($lau);
        $label2 = new Label(456, 'my label');
        $user2 = new User(654, 'joe user');
        $lau = new LabelAndUser($label2, $user2);
        $file->addFileLabel($lau);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
            'only_file_labels' => [123],
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],

        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertSuccessful();
    }

    public function testStoreImportValidateImageAnnotationPoints()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            // Incorrect points for the shape.
            points: [10, 10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'import_annotations' => true,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportValidateVideoAnnotationPoints()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new VideoMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new VideoAnnotation(
            shape: Shape::point(),
            // Must be an array of arrays.
            points: [10, 10],
            frames: [1],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::videoId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'import_annotations' => true,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }

    public function testStoreImportValidateVideoAnnotationFrames()
    {
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $metadata = new VolumeMetadata;
        $file = new VideoMetadata('1.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10]],
            // Must have the same number of elements than points.
            frames: [],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::videoId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
            'volume_id' => $this->volume()->id,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'import_annotations' => true,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        $this->postJson("/api/v1/pending-volumes/{$id}/import")->assertStatus(422);
    }
}
