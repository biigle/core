<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use ApiTestCase;
use Biigle\PendingVolume;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Shape;
use Illuminate\Support\Facades\Cache;

class PendingVolumeControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
        ]);

        // not logged in
        $this->get("pending-volumes/{$pv->id}")->assertStatus(302);

        // doesn't belong to pending volume
        $this->beExpert();
        $this->get("pending-volumes/{$pv->id}")->assertStatus(403);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}")->assertStatus(200);
    }

    public function testShowWithVolumeRedirectToSelectAnnotationLabels()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'import_annotations' => true,
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}")
            ->assertRedirectToRoute('pending-volume-annotation-labels', $pv->id);
    }

    public function testShowWithVolumeRedirectToSelectFileLabels()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'import_file_labels' => true,
            'only_annotation_labels' => [123],
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}")
            ->assertRedirectToRoute('pending-volume-file-labels', $pv->id);
    }

    public function testShowWithVolumeRedirectToLabelMap()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'only_annotation_labels' => [123],
            'only_file_labels' => [123],
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}")
            ->assertRedirectToRoute('pending-volume-label-map', $pv->id);
    }

    public function testShowWithVolumeRedirectToLabelMapOnlyAnnotations()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'only_annotation_labels' => [123],
            'import_annotations' => true,
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}")
            ->assertRedirectToRoute('pending-volume-label-map', $pv->id);
    }

    public function testShowWithVolumeRedirectToLabelMapOnlyFileLabels()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'only_file_labels' => [123],
            'import_file_labels' => true,
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}")
            ->assertRedirectToRoute('pending-volume-label-map', $pv->id);
    }

    public function testShowWithVolumeRedirectToUserMap()
    {
        // volume_id, only_annotation_labels and/or only_file_labels and label_map are filled but user_map is empty.
    }

    public function testShowSelectAnnotationLabels()
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
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);

        // not logged in
        $this->get("pending-volumes/{$pv->id}/annotation-labels")->assertStatus(302);

        // doesn't belong to pending volume
        $this->beExpert();
        $this->get("pending-volumes/{$pv->id}/annotation-labels")->assertStatus(403);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/annotation-labels")->assertStatus(200);
    }

    public function testShowSelectAnnotationLabelsNoVolume()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}/annotation-labels")
            ->assertRedirectToRoute('pending-volume', $pv->id);
    }

    public function testShowSelectAnnotationLabelsNoMetadata()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
        ]);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/annotation-labels")->assertStatus(404);
    }

    public function testShowSelectAnnotationLabelsNoAnnotations()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/annotation-labels")->assertStatus(404);
    }

    public function testShowSelectFileLabels()
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
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);

        // not logged in
        $this->get("pending-volumes/{$pv->id}/file-labels")->assertStatus(302);

        // doesn't belong to pending volume
        $this->beExpert();
        $this->get("pending-volumes/{$pv->id}/file-labels")->assertStatus(403);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/file-labels")->assertStatus(200);
    }

    public function testShowSelectFileLabelsNoVolume()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}/file-labels")
            ->assertRedirectToRoute('pending-volume', $pv->id);
    }

    public function testShowSelectFileLabelsNoMetadata()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
        ]);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/file-labels")->assertStatus(404);
    }

    public function testShowSelectFileLabelsNoFileLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/file-labels")->assertStatus(404);
    }

    public function testShowSelectLabelMap()
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
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);

        // not logged in
        $this->get("pending-volumes/{$pv->id}/label-map")->assertStatus(302);

        // doesn't belong to pending volume
        $this->beExpert();
        $this->get("pending-volumes/{$pv->id}/label-map")->assertStatus(403);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/label-map")->assertStatus(200);
    }

    public function testShowSelectLabelMapNoVolume()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
        ]);

        $this->beAdmin();
        $this
            ->get("pending-volumes/{$pv->id}/label-map")
            ->assertRedirectToRoute('pending-volume', $pv->id);
    }

    public function testShowSelectLabelMapNoMetadata()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
        ]);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/label-map")->assertStatus(404);
    }

    public function testShowSelectLabelMapNoLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('1.jpg');
        $metadata->addFile($file);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
            'volume_id' => $this->volume()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}/label-map")->assertStatus(404);
    }
}
