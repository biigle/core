<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Role;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;

class ProjectsAttachableVolumesControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $validVolume = VolumeTest::create();
        $validProject = ProjectTest::create();
        $validProject->addVolumeId($validVolume->id);
        $validProject->addUserId($this->admin()->id, Role::adminId());

        $invalidVolume = VolumeTest::create();
        $invalidProject = ProjectTest::create();
        $invalidProject->addVolumeId($invalidVolume->id);
        $invalidProject->addUserId($this->admin()->id, Role::editorId());

        $existingVolume = $this->volume();
        $validProject->addVolumeId($existingVolume->id); // should not be returned
        $id = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/attachable-volumes");

        $this->beEditor();
        $response = $this->get("/api/v1/projects/{$id}/attachable-volumes");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("/api/v1/projects/{$id}/attachable-volumes");
        $response->assertStatus(200);

        $response->assertExactJson([[
            'id' => $validVolume->id,
            'name' => $validVolume->name,
            'media_type_id' => $validVolume->media_type_id,
            'media_type' => $validVolume->mediaType,
            'updated_at' => $validVolume->updated_at->toJson(),
            'thumbnailUrl' => null,
            'thumbnailsUrl' => [],
        ]]);
    }
}
