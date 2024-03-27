<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use ApiTestCase;
use Biigle\PendingVolume;

class VolumeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        // not logged in
        $response = $this->get("volumes/{$id}");
        $response->assertStatus(302);

        // doesn't belong to project
        $this->beUser();
        $response = $this->get("volumes/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("volumes/{$id}");
        $response->assertStatus(200);

        $this->beEditor();
        $response = $this->get("volumes/{$id}");
        $response->assertStatus(200);

        $this->beExpert();
        $response = $this->get("volumes/{$id}");
        $response->assertStatus(200);

        $this->beAdmin();
        $response = $this->get("volumes/{$id}");
        $response->assertStatus(200);

        // doesn't exist
        $response = $this->get('projects/-1');
        $response->assertStatus(404);
    }

    public function testCreate()
    {
        $id = $this->project()->id;

        // not logged in
        $response = $this->get('volumes/create');
        $response->assertStatus(302);

        $this->beEditor();
        // user is not allowed to edit the project
        $response = $this->get('volumes/create?project='.$id);
        $response->assertStatus(403);

        $this->beAdmin();
        // project doesn't exist
        $response = $this->get('volumes/create?project=-1');
        $response->assertStatus(404);

        $response = $this->get('volumes/create?project='.$id);
        $response->assertStatus(200);
    }

    public function testCreateWithExistingRedirectToStep2()
    {
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'user_id' => $this->admin()->id,
        ]);

        $id = $this->project()->id;
        $this->beAdmin();

        $this
            ->get('volumes/create?project='.$id)
            ->assertRedirectToRoute('pending-volume', $pv->id);
    }

    public function testCreateWithExistingRedirectToSelectAnnotationLabels()
    {
        // volume_id is filled and import_annotations is true but only_annotation_labels, only_file_labels, label_map and user_map is empty.
    }

    public function testCreateWithExistingRedirectToSelectFileLabels()
    {
        // volume_id and only_annotation_labels are filled and import_file_labels is true but only_file_labels, label_map and user_map are empty.
    }

    public function testCreateWithExistingRedirectToLabelMap()
    {
        // volume_id and only_annotation_labels and/or only_file_labels are filled but label_map and user_map are empty.
    }

    public function testCreateWithExistingRedirectToUserMap()
    {
        // volume_id, only_annotation_labels and/or only_file_labels and label_map are filled but user_map is empty.
    }

    public function testEdit()
    {
        $id = $this->volume()->id;

        $this->beUser();
        $response = $this->get("volumes/edit/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("volumes/edit/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->get("volumes/edit/{$id}");
        $response->assertStatus(403);

        $this->beExpert();
        $response = $this->get("volumes/edit/{$id}");
        $response->assertStatus(403);

        // even the volume creator is not allowed if they are no project admin
        $this->be($this->volume()->creator);
        $response = $this->get("volumes/edit/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("volumes/edit/{$id}");
        $response->assertStatus(200);

        $response = $this->get('volumes/edit/0');
        $response->assertStatus(404);
    }
}
