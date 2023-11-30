<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\PendingVolume;

class ProjectPendingVolumeControllerTest extends ApiTestCase
{
    public function testStoreImages()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/pending-volumes");

        $this->beEditor();
        $this->post("/api/v1/projects/{$id}/pending-volumes")->assertStatus(403);

        $this->beAdmin();
        // Missing arguments.
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes")->assertStatus(422);

        // Incorrect media type.
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'whatever',
        ])->assertStatus(422);

        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'image',
        ])->assertStatus(201);

        $pv = PendingVolume::where('project_id', $id)->first();
        $this->assertEquals(MediaType::imageId(), $pv->media_type_id);
        $this->assertEquals($this->admin()->id, $pv->user_id);
    }

    public function testStoreTwice()
    {
        $this->beAdmin();
        $id = $this->project()->id;
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'image',
        ])->assertStatus(201);

        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'image',
        ])->assertStatus(422);
    }

    public function testStoreVideo()
    {
        $this->beAdmin();
        $id = $this->project()->id;
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'video',
        ])->assertStatus(201);
    }
}
