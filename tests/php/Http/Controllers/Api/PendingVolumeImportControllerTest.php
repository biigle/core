<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Label as DbLabel;
use Biigle\LabelTree;
use Biigle\MediaType;
use Biigle\PendingVolume;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Shape;
use Biigle\Visibility;
use Biigle\Volume;
use Cache;

class PendingVolumeImportControllerTest extends ApiTestCase
{
    public function testStoreAnnotationLabels()
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

    public function testStoreFileLabels()
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

    public function testStoreLabelMap()
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

    public function testStoreLabelMapFileLabel()
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

    public function testStoreLabelMapTryIgnoredAnnotationLabel()
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

    public function testStoreLabelMapTryIgnoredFileLabel()
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

    public function testStoreLabelMapTryLabelNotAllowed()
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

    public function testStoreUserMap()
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

    public function testStoreUserMapFileLabel()
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
}
