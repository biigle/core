<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\MediaType;
use Biigle\PendingVolume;
use Biigle\Volume;
use Exception;
use FileCache;
use Illuminate\Http\UploadedFile;
use Queue;
use Storage;

class PendingVolumeControllerTest extends ApiTestCase
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

    public function testStoreFromUI()
    {
        $id = $this->project()->id;

        $this->beAdmin();
        $response = $this->post("/api/v1/projects/{$id}/pending-volumes", [
            'media_type' => 'image',
        ]);

        $pv = PendingVolume::first();

        $response->assertRedirectToRoute('pending-volume', $pv->id);
    }

    public function testUpdateImages()
    {
        config(['volumes.editor_storage_disks' => ['test']]);
        $disk = Storage::fake('test');
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->editor()->id,
        ]);
        $id = $pv->id;
        $this->doTestApiRoute('PUT', "/api/v1/pending-volumes/{$id}");

        $this->beEditor();
        $this->putJson("/api/v1/pending-volumes/{$id}")->assertStatus(403);

        $this->beAdmin();
        // Does not own the pending volume.
        $this->putJson("/api/v1/pending-volumes/{$id}")->assertStatus(403);

        $pv->update(['user_id' => $this->admin()->id]);
        // mssing arguments
        $this->putJson("/api/v1/pending-volumes/{$id}")->assertStatus(422);

        // invalid url format
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test',
            'files' => ['1.jpg', '2.jpg'],
        ])->assertStatus(422);

        // unknown storage disk
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'files' => ['1.jpg', '2.jpg'],
        ])->assertStatus(422);

        // images directory dows not exist in storage disk
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg', '2.jpg'],
        ])->assertStatus(422);

        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');
        $disk->put('images/2.jpg', 'abc');
        $disk->put('images/1.bmp', 'abc');

        // images array is empty
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => [],
        ])->assertStatus(422);

        // error because of duplicate image
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg', '1.jpg'],
        ])->assertStatus(422);

        // error because of unsupported image format
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.bmp'],
        ])->assertStatus(422);

        // Image filename too long.
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg'],
        ])->assertStatus(422);

        $response = $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            // Elements should be sanitized and empty elements should be discarded
            'files' => ['" 1.jpg"', '', '\'2.jpg\' ', '', ''],
        ])->assertSuccessful();
        $content = $response->getContent();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);

        $id = json_decode($content)->volume_id;
        Queue::assertPushed(CreateNewImagesOrVideos::class, function ($job) use ($id) {
            $this->assertEquals($id, $job->volume->id);
            $this->assertContains('1.jpg', $job->filenames);
            $this->assertContains('2.jpg', $job->filenames);
            $this->assertCount(2, $job->filenames);

            return true;
        });

        $this->assertNull($pv->fresh());

        $this->assertEquals(1, $this->project()->volumes()->count());
        $volume = $this->project()->volumes()->first();
        $this->assertEquals('my volume no. 1', $volume->name);
        $this->assertEquals('test://images', $volume->url);
        $this->assertEquals(MediaType::imageId(), $volume->media_type_id);
    }

    public function testUpdateImagesWithMetadata()
    {
        $pendingMetaDisk = Storage::fake('pending-metadata');
        $metaDisk = Storage::fake('metadata');
        $fileDisk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;
        $pendingMetaDisk->put('mymeta.csv', 'abc');

        $fileDisk->makeDirectory('images');
        $fileDisk->put('images/1.jpg', 'abc');

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
        ])->assertSuccessful();

        $volume = $this->project()->volumes()->first();
        $this->assertTrue($volume->hasMetadata());
        $metaDisk->assertExists($volume->metadata_file_path);
        $pendingMetaDisk->assertMissing($pv->metadata_file_path);
    }

    public function testUpdateImportAnnotations()
    {
        $pendingMetaDisk = Storage::fake('pending-metadata');
        $fileDisk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;
        $pendingMetaDisk->put('mymeta.csv', 'abc');

        $fileDisk->makeDirectory('images');
        $fileDisk->put('images/1.jpg', 'abc');

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
            'import_annotations' => true,
        ])->assertSuccessful();

        $pv = $pv->fresh();
        $this->assertNotNull($pv);
        $volume = $this->project()->volumes()->first();
        $this->assertEquals($volume->id, $pv->volume_id);
        $this->assertTrue($pv->import_annotations);
    }

    public function testUpdateImportFileLabels()
    {
        $pendingMetaDisk = Storage::fake('pending-metadata');
        $fileDisk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);

        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;
        $pendingMetaDisk->put('mymeta.csv', 'abc');

        $fileDisk->makeDirectory('images');
        $fileDisk->put('images/1.jpg', 'abc');

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
            'import_file_labels' => true,
        ])->assertSuccessful();

        $pv = $pv->fresh();
        $this->assertNotNull($pv);
        $volume = $this->project()->volumes()->first();
        $this->assertEquals($volume->id, $pv->volume_id);
        $this->assertTrue($pv->import_file_labels);
    }

    public function testUpdateFromUIWithoutImport()
    {
        $disk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ]);
        $id = $pv->id;

        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');

        $this->beAdmin();
        $response = $this->put("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
        ]);
        $volume = Volume::first();

        $response->assertRedirectToRoute('volume', $volume->id);
    }

    public function testUpdateFromUIWithAnnotationImport()
    {
        $disk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ]);
        $id = $pv->id;

        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');

        $this->beAdmin();
        $response = $this->put("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'import_annotations' => true,
            'files' => ['1.jpg'],
        ]);
        $volume = Volume::first();

        $response->assertRedirectToRoute('pending-volume-annotation-labels', $id);
    }

    public function testUpdateFromUIWithFileLabelImport()
    {
        $disk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ]);
        $id = $pv->id;

        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');

        $this->beAdmin();
        $response = $this->put("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'import_file_labels' => true,
            'files' => ['1.jpg'],
        ]);
        $volume = Volume::first();

        $response->assertRedirectToRoute('pending-volume-file-labels', $id);
    }

    public function testUpdateFileString()
    {
        $disk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ]);
        $id = $pv->id;

        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');
        $disk->put('images/2.jpg', 'abc');

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$pv->id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => '"1.jpg" , 2.jpg , ,',
        ])->assertSuccessful();

        $volume = Volume::first();
        Queue::assertPushed(CreateNewImagesOrVideos::class, function ($job) {
            $this->assertContains('1.jpg', $job->filenames);
            $this->assertContains('2.jpg', $job->filenames);
            $this->assertCount(2, $job->filenames);

            return true;
        });
    }

    public function testUpdateHandle()
    {
        config(['volumes.editor_storage_disks' => ['test']]);
        $disk = Storage::fake('test');
        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;

        $this->beAdmin();
        // Invalid handle format.
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
            'handle' => 'https://doi.org/10.3389/fmars.2017.00083',
        ])->assertStatus(422);

        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
            'handle' => '10.3389/fmars.2017.00083',
        ])->assertStatus(200);

        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertEquals('10.3389/fmars.2017.00083', $volume->handle);

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;

        // Some DOIs can contain multiple slashes.
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
            'handle' => '10.3389/fmars.2017/00083',
        ])->assertStatus(200);

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;

        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
            'handle' => '',
        ])->assertStatus(200);

        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNull($volume->handle);
    }

    public function testUpdateFilesExist()
    {
        config(['volumes.editor_storage_disks' => ['test']]);
        $disk = Storage::fake('test');
        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;

        $this->beAdmin();

        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg', '2.jpg'],
        ])->assertStatus(422);

        $disk->put('images/2.jpg', 'abc');

        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg', '2.jpg'],
        ])->assertSuccessful();
    }

    public function testUpdateUnableToParseUri()
    {
        config(['volumes.editor_storage_disks' => ['test']]);
        $disk = Storage::fake('test');
        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');
        $disk->put('images/2.jpg', 'abc');

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;
        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'https:///my/images',
            'files' => ['1.jpg', '2.jpg'],
        ])->assertStatus(422);
    }

    public function testUpdateFilesExistException()
    {
        config(['volumes.editor_storage_disks' => ['test']]);
        $disk = Storage::fake('test');
        $disk->makeDirectory('images');
        $disk->put('images/1.jpg', 'abc');

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;
        $this->beAdmin();
        FileCache::shouldReceive('exists')->andThrow(new Exception('Invalid MIME type.'));

        $response = $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'files' => ['1.jpg'],
        ])->assertStatus(422);

        $this->assertStringContainsString('Some files could not be accessed. Invalid MIME type.', $response->getContent());
    }

    public function testUpdateVideos()
    {
        config(['volumes.editor_storage_disks' => ['test']]);
        $disk = Storage::fake('test');
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::videoId(),
            'user_id' => $this->admin()->id,
        ]);
        $id = $pv->id;

        $this->beAdmin();
        // invalid url format
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test',
            'files' => ['1.mp4', '2.mp4'],
        ])->assertStatus(422);

        // unknown storage disk
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'files' => ['1.mp4', '2.mp4'],
        ])->assertStatus(422);

        // videos directory dows not exist in storage disk
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'files' => ['1.mp4', '2.mp4'],
        ])->assertStatus(422);

        $disk->makeDirectory('videos');
        $disk->put('videos/1.mp4', 'abc');
        $disk->put('videos/2.mp4', 'abc');

        // error because of duplicate video
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'files' => ['1.mp4', '1.mp4'],
        ])->assertStatus(422);

        // error because of unsupported video format
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'files' => ['1.avi'],
        ])->assertStatus(422);

        // Video filename too long.
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'files' => ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4'],
        ])->assertStatus(422);

        $response = $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            // Elements should be sanitized and empty elements should be discarded
            'files' => ['" 1.mp4"', '', '\'2.mp4\' ', '', ''],
        ])->assertSuccessful();

        $id = json_decode($response->getContent())->volume_id;
        Queue::assertPushed(CreateNewImagesOrVideos::class, function ($job) use ($id) {
            $this->assertEquals($id, $job->volume->id);
            $this->assertContains('1.mp4', $job->filenames);
            $this->assertContains('2.mp4', $job->filenames);

            return true;
        });

        $this->assertNull($pv->fresh());

        $this->assertEquals(1, $this->project()->volumes()->count());
        $volume = $this->project()->volumes()->first();
        $this->assertEquals('my volume no. 1', $volume->name);
        $this->assertEquals('test://videos', $volume->url);
        $this->assertEquals(MediaType::videoId(), $volume->media_type_id);
    }

    public function testUpdateVideosWithMetadata()
    {
        $pendingMetaDisk = Storage::fake('pending-metadata');
        $metaDisk = Storage::fake('metadata');
        $fileDisk = Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::videoId(),
            'user_id' => $this->admin()->id,
            'metadata_file_path' => 'mymeta.csv',
        ]);
        $id = $pv->id;
        $pendingMetaDisk->put('mymeta.csv', 'abc');

        $fileDisk->makeDirectory('videos');
        $fileDisk->put('videos/1.mp4', 'abc');

        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'files' => ['1.mp4'],
        ])->assertSuccessful();

        $volume = $this->project()->volumes()->first();
        $this->assertTrue($volume->hasMetadata());
        $metaDisk->assertExists($volume->metadata_file_path);
        $pendingMetaDisk->assertMissing($pv->metadata_file_path);
    }

    public function testUpdateProviderDenylist()
    {
        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;
        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'my volume no. 1',
            'url' => 'https://dropbox.com',
            'files' => ['1.jpg', '2.jpg'],
        ])->assertStatus(422);
    }

    public function testUpdateAuthorizeDisk()
    {
        config(['volumes.admin_storage_disks' => ['admin-test']]);
        config(['volumes.editor_storage_disks' => ['editor-test']]);

        $adminDisk = Storage::fake('admin-test');
        $adminDisk->put('images/1.jpg', 'abc');

        $editorDisk = Storage::fake('editor-test');
        $editorDisk->put('images/2.jpg', 'abc');

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;
        $this->beAdmin();
        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'name',
            'url' => 'admin-test://images',
            'files' => ['1.jpg'],
        ])->assertStatus(422);

        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'name',
            'url' => 'editor-test://images',
            'files' => ['2.jpg'],
        ])->assertSuccessful();

        $id = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ])->id;

        $this->beGlobalAdmin();

        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'name',
            'url' => 'editor-test://images',
            'files' => ['2.jpg'],
        ])->assertStatus(422);

        $this->putJson("/api/v1/pending-volumes/{$id}", [
            'name' => 'name',
            'url' => 'admin-test://images',
            'files' => ['1.jpg'],
        ])->assertSuccessful();
    }

    public function testDestroy()
    {
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ]);

        $this->beExpert();
        $this->deleteJson("/api/v1/pending-volumes/{$pv->id}")->assertStatus(403);

        $this->beAdmin();
        $this->deleteJson("/api/v1/pending-volumes/{$pv->id}")->assertStatus(200);
        $this->assertNull($pv->fresh());
    }

    public function testDestroyFromUI()
    {
        $pv = PendingVolume::factory()->create([
            'project_id' => $this->project()->id,
            'media_type_id' => MediaType::imageId(),
            'user_id' => $this->admin()->id,
        ]);

        $this->beAdmin();
        $this
            ->delete("/api/v1/pending-volumes/{$pv->id}")
            ->assertRedirectToRoute('create-volume', ['project' => $pv->project_id]);
    }
}
