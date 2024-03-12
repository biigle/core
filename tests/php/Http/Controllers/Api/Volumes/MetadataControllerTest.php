<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Jobs\UpdateVolumeMetadata;
use Biigle\MediaType;
use Illuminate\Http\UploadedFile;
use Queue;
use Storage;

class MetadataControllerTest extends ApiTestCase
{
    public function testGet()
    {
        $volume = $this->volume();
        $id = $volume->id;

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/metadata");

        $this->beUser();
        $this->getJson("/api/v1/volumes/{$id}/metadata")
            ->assertStatus(403);

        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$id}/metadata")
            ->assertStatus(404);

        $disk = Storage::fake('metadata');
        $disk->put($id.'.csv', 'abc');
        $volume->metadata_file_path = $id.'.csv';
        $volume->save();

        $this->getJson("/api/v1/volumes/-1/metadata")
            ->assertStatus(404);

        $response = $this->getJson("/api/v1/volumes/{$id}/metadata");
        $response->assertStatus(200);
        $this->assertEquals("attachment; filename=biigle-volume-{$id}-metadata.csv", $response->headers->get('content-disposition'));
    }

    public function testStoreDeprecated()
    {
        $id = $this->volume()->id;
        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/images/metadata");
    }

    public function testStoreImageMetadata()
    {
        Storage::fake('metadata');
        $id = $this->volume()->id;

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/metadata");

        $csv = new UploadedFile(__DIR__."/../../../../../files/image-metadata.csv", 'image-metadata.csv', 'text/csv', null, true);
        $this->beEditor();
        // no permissions
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertStatus(403);

        $this->beAdmin();
        // file required
        $this->postJson("/api/v1/volumes/{$id}/metadata")->assertStatus(422);


        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertStatus(200);

        Queue::assertPushed(UpdateVolumeMetadata::class, function ($job) {
            $this->assertEquals($this->volume()->id, $job->volume->id);

            return true;
        });
    }

    public function testStoreImageMetadataInvalid()
    {
        $id = $this->volume()->id;
        $csv = new UploadedFile(__DIR__."/../../../../../files/image-metadata-invalid.csv", 'image-metadata-invalid.csv', 'text/csv', null, true);
        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertStatus(422);
    }

    public function testStoreVideoMetadataCsv()
    {
        Storage::fake('metadata');
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $csv = new UploadedFile(__DIR__."/../../../../../files/video-metadata.csv", 'metadata.csv', 'text/csv', null, true);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertSuccessful();

        Queue::assertPushed(UpdateVolumeMetadata::class, function ($job) {
            $this->assertEquals($this->volume()->id, $job->volume->id);

            return true;
        });
    }

    public function testStoreMetadataIncorrectEncoding()
    {
        $id = $this->volume()->id;

        $csv = new UploadedFile(__DIR__."/../../../../../files/image-metadata-strange-encoding.csv", 'metadata.csv', 'text/csv', null, true);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertStatus(422);
    }

    public function testDestroy()
    {
        $volume = $this->volume();
        $id = $volume->id;

        $this->doTestApiRoute('DELETE', "/api/v1/volumes/{$id}/metadata");

        $disk = Storage::fake('metadata');
        $disk->put($id.'.csv', 'abc');
        $volume->metadata_file_path = $id.'.csv';
        $volume->save();

        $this->beExpert();
        $this->deleteJson("/api/v1/volumes/{$id}/metadata")
            ->assertStatus(403);

        $this->beAdmin();
        $this->deleteJson("/api/v1/volumes/{$id}/metadata")
            ->assertSuccessful();

        $this->assertFalse($volume->fresh()->hasMetadata());
    }
}
