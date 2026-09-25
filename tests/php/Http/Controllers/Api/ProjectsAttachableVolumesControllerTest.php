<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Role;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;

class ProjectsAttachableVolumesControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $validVolume = VolumeTest::create(['name' => 'test']);
        $validProject = ProjectTest::create();
        $validProject->addVolumeId($validVolume->id);
        $validProject->addUserId($this->admin()->id, Role::ADMIN->value);

        $invalidVolume = VolumeTest::create(['name' => 'test']);
        $invalidProject = ProjectTest::create();
        $invalidProject->addVolumeId($invalidVolume->id);
        $invalidProject->addUserId($this->admin()->id, Role::EDITOR->value);

        $existingVolume = $this->volume();
        $validProject->addVolumeId($existingVolume->id); // should not be returned
        $id = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/attachable-volumes/test");

        $this->beEditor();
        $response = $this->get("/api/v1/projects/{$id}/attachable-volumes/test");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("/api/v1/projects/{$id}/attachable-volumes/test");
        $response->assertStatus(200);

        $this->assertCount(1, $response->decodeResponseJson());
        $response->assertExactJson([[
            'id' => $validVolume->id,
            'name' => $validVolume->name,
            'media_type' => $validVolume->media_type,
            'updated_at' => $validVolume->updated_at->toJson(),
            'thumbnailUrl' => null,
            'thumbnailsUrl' => [],
        ]]);
    }

    public function testIndexFuzzySearch()
    {
        $validVolume = VolumeTest::create(['name' => 'my test']);
        $validProject = ProjectTest::create();
        $validProject->addVolumeId($validVolume->id);
        $validProject->addUserId($this->admin()->id, Role::ADMIN->value);

        $invalidVolume = VolumeTest::create(['name' => 'my test']);
        $invalidProject = ProjectTest::create();
        $invalidProject->addVolumeId($invalidVolume->id);
        $invalidProject->addUserId($this->admin()->id, Role::EDITOR->value);

        $existingVolume = $this->volume();
        $validProject->addVolumeId($existingVolume->id); // should not be returned
        $id = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/attachable-volumes/test");

        $this->beEditor();
        $response = $this->get("/api/v1/projects/{$id}/attachable-volumes/test");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("/api/v1/projects/{$id}/attachable-volumes/test");
        $response->assertStatus(200);

        $this->assertCount(1, $response->decodeResponseJson());
        $response->assertExactJson([[
            'id' => $validVolume->id,
            'name' => $validVolume->name,
            'media_type' => $validVolume->media_type,
            'updated_at' => $validVolume->updated_at->toJson(),
            'thumbnailUrl' => null,
            'thumbnailsUrl' => [],
        ]]);
    }

    /**
     * After turning MediaType into an enum, make sure it's still correctly handled internally.
     */
    public function testIndexReturnsThumbnailUrl()
    {
        $validVolume = VolumeTest::create(['name' => 'test']);
        $image = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $validVolume->id
        ]);

        $validProject = ProjectTest::create();
        $validProject->addUserId($this->admin()->id, Role::ADMIN);
        $validProject->addVolumeId($validVolume->id);

        $id = $this->project()->id;
        $this->beAdmin();
        $response = $this->get("/api/v1/projects/{$id}/attachable-volumes/test");
        $response->assertStatus(200);

        $json = $response->decodeResponseJson();
        $this->assertCount(1, $json);
        $this->assertStringContainsString($image->uuid, $json[0]['thumbnailUrl']);
        $this->assertCount(1, $json[0]['thumbnailsUrl']);
        $this->assertStringContainsString($image->uuid, $json[0]['thumbnailsUrl'][0]);
    }
}
