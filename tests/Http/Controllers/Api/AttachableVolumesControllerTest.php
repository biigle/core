<?php

namespace Biigle\Tests\Modules\Projects\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;

class AttachableVolumesControllerTest extends ApiTestCase
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
            'thumbnailUrl' => null,
            'thumbnailsUrl' => [],
        ]]);
    }
}
