<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\PendingVolume;
use Illuminate\Http\UploadedFile;
use Storage;

class ProjectPendingVolumeControllerTest extends ApiTestCase
{
    public function testStoreImage()
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

    public function testStoreImageWithFile()
    {
        $disk = Storage::fake('pending-metadata');
        $csv = __DIR__."/../../../../files/image-metadata.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);

        $id = $this->project()->id;
        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'image',
            'metadata_file' => $file,
        ])->assertStatus(201);

        $pv = PendingVolume::where('project_id', $id)->first();
        $this->assertNotNull($pv->metadata_file_path);
        $disk->assertExists($pv->metadata_file_path);
    }

    public function testStoreImageWithFileUnknown()
    {
        $disk = Storage::fake('pending-metadata');
        $csv = __DIR__."/../../../../files/test.mp4";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);

        $id = $this->project()->id;
        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'image',
            'metadata_file' => $file,
        ])->assertStatus(422);
    }

    public function testStoreImageWithFileInvalid()
    {
        $disk = Storage::fake('pending-metadata');
        $csv = __DIR__."/../../../../files/image-metadata-invalid.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);

        $id = $this->project()->id;
        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'image',
            'metadata_file' => $file,
        ])->assertStatus(422);
    }

    public function testStoreVideoWithFile()
    {
        $disk = Storage::fake('pending-metadata');
        $csv = __DIR__."/../../../../files/video-metadata.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);

        $id = $this->project()->id;
        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'video',
            'metadata_file' => $file,
        ])->assertStatus(201);

        $pv = PendingVolume::where('project_id', $id)->first();
        $this->assertNotNull($pv->metadata_file_path);
        $disk->assertExists($pv->metadata_file_path);
    }

    public function testStoreVideoWithFileUnknown()
    {
        $disk = Storage::fake('pending-metadata');
        $csv = __DIR__."/../../../../files/test.mp4";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);

        $id = $this->project()->id;
        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'video',
            'metadata_file' => $file,
        ])->assertStatus(422);
    }

    public function testStoreVideoWithFileInvalid()
    {
        $disk = Storage::fake('pending-metadata');
        $csv = __DIR__."/../../../../files/video-metadata-invalid.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);

        $id = $this->project()->id;
        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'video',
            'metadata_file' => $file,
        ])->assertStatus(422);
    }
}
