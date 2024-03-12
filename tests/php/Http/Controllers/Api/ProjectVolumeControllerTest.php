<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Image;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\Jobs\DeleteVolume;
use Biigle\Role;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Video;
use Biigle\Volume;
use Cache;
use Exception;
use FileCache;
use Illuminate\Http\UploadedFile;
use Queue;
use Storage;

class ProjectVolumeControllerTest extends ApiTestCase
{
    private $volume;

    public function setUp(): void
    {
        parent::setUp();
        $this->volume = VolumeTest::create();
        $this->project()->volumes()->attach($this->volume);
        Storage::fake('test');
        config(['volumes.editor_storage_disks' => ['test']]);
    }

    public function testIndex()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/volumes");

        $this->beUser();
        $response = $this->get("/api/v1/projects/{$id}/volumes");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/projects/{$id}/volumes");
        $content = $response->getContent();
        $response->assertStatus(200);
        // response should not be an empty array
        $this->assertStringStartsWith('[{', $content);
        $this->assertStringEndsWith('}]', $content);
        $this->assertStringNotContainsString('pivot', $content);
    }

    public function testStoreImages()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/volumes");

        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$id}/volumes");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes");
        // mssing arguments
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => 99999,
            'files' => '1.jpg, 2.jpg',
        ]);
        // media type does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test',
            'media_type' => 'image',
            'files' => '1.jpg, 2.jpg',
        ]);
        // invalid url format
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type' => 'image',
            'files' => '1.jpg, 2.jpg',
        ]);
        // unknown storage disk
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.jpg, 2.jpg',
        ]);
        // images directory dows not exist in storage disk
        $response->assertStatus(422);

        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');
        Storage::disk('test')->put('images/1.bmp', 'abc');

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '',
        ]);
        // images array is empty
        $response->assertStatus(422);

        $count = $this->project()->volumes()->count();
        $imageCount = Image::all()->count();

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.jpg, , 1.jpg',
        ]);
        // error because of duplicate image
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.bmp',
        ]);
        // error because of unsupported image format
        $response->assertStatus(422);

        // Image filename too long.
        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg',
            ])
            ->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            // empty parts should be discarded
            'files' => '1.jpg, , 2.jpg, , ,',
        ]);
        $response->assertSuccessful();
        $content = $response->getContent();
        $this->assertEquals($count + 1, $this->project()->volumes()->count());
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);

        $id = json_decode($content)->id;
        Queue::assertPushed(CreateNewImagesOrVideos::class, function ($job) use ($id) {
            return $job->volume->id === $id &&
                in_array('1.jpg', $job->filenames) &&
                in_array('2.jpg', $job->filenames);
        });
    }

    public function testStoreHandle()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'handle' => 'https://doi.org/10.3389/fmars.2017.00083',
            ])
            ->assertStatus(422);

        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'handle' => '10.3389/fmars.2017.00083',
            ])
            ->assertStatus(201);
        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertEquals('10.3389/fmars.2017.00083', $volume->handle);

        // Some DOIs can contain multiple slashes.
        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'handle' => '10.3389/fmars.2017/00083',
            ])
            ->assertStatus(201);

        // Backwards compatibility.
        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'doi' => '10.3389/fmars.2017.00083',
            ])
            ->assertStatus(201);

        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'handle' => '',
            ])
            ->assertStatus(201);
        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNull($volume->handle);
    }

    public function testStoreFilesArray()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => ['1.jpg', '2.jpg'],
            ])
            ->assertSuccessful();
    }

    public function testStoreFilesExist()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg, 2.jpg',
            ])
            ->assertStatus(422);

        Storage::disk('test')->put('images/2.jpg', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg, 2.jpg',
            ])
            ->assertSuccessful();
    }

    public function testStoreDeprecatedImagesAttribute()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'images' => '1.jpg',
            ])
            ->assertSuccessful();
    }

    public function testStoreNoMediaTypeAttribute()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'files' => '1.jpg',
            ])
            ->assertSuccessful();
    }

    public function testStoreUnableToParseUri()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'https:///my/images',
                'media_type' => 'image',
                'files' => ['1.jpg', '2.jpg'],
            ])
            ->assertStatus(422);
    }

    public function testStoreFilesExistException()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $id = $this->project()->id;
        $this->beAdmin();
        FileCache::shouldReceive('exists')
            ->andThrow(new Exception('Invalid MIME type.'));

        $response = $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
            ])
            ->assertStatus(422);
        $this->assertStringContainsString('Some files could not be accessed. Invalid MIME type.', $response->getContent());
    }

    public function testStoreVideos()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test',
            'media_type' => 'video',
            'files' => '1.mp4, 2.mp4',
        ]);
        // invalid url format
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type' => 'video',
            'files' => '1.mp4, 2.mp4',
        ]);
        // unknown storage disk
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            'files' => '1.mp4, 2.mp4',
        ]);
        // videos directory dows not exist in storage disk
        $response->assertStatus(422);

        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');
        Storage::disk('test')->put('videos/2.mp4', 'abc');

        $count = $this->project()->volumes()->count();
        $videoCount = Video::all()->count();

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            'files' => '1.mp4, , 1.mp4',
        ]);
        // error because of duplicate video
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            'files' => '1.avi',
        ]);
        // error because of unsupported video format
        $response->assertStatus(422);

        // Video filename too long.
        $this
            ->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://videos',
                'media_type' => 'video',
                'files' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4',
            ])
            ->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            // empty parts should be discarded
            'files' => '1.mp4, 2.mp4',
        ]);
        $response->assertSuccessful();
        $this->assertEquals($count + 1, $this->project()->volumes()->count());

        $id = json_decode($response->getContent())->id;
        Queue::assertPushed(CreateNewImagesOrVideos::class, function ($job) use ($id) {
            return $job->volume->id === $id &&
                in_array('1.mp4', $job->filenames) &&
                in_array('2.mp4', $job->filenames);
        });
    }

    public function testStoreEmptyImageMetadataText()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'metadata_text' => "",
            ])
            ->assertSuccessful();

        $volume = $this->project()->volumes()->first();
        $this->assertNull($volume->metadata_file_path);
    }

    public function testStoreImageMetadataText()
    {
        Storage::fake('metadata');
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'metadata_text' => "filename,area\n1.jpg,2.5",
            ])
            ->assertSuccessful();

        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNotNull($volume->metadata_file_path);
    }

    public function testStoreImageMetadataCsv()
    {
        Storage::fake('metadata');

        $id = $this->project()->id;
        $this->beAdmin();
        $csv = __DIR__."/../../../../files/image-metadata.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/abc.jpg', 'abc');

        $this->postJson("/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => 'abc.jpg',
            'metadata_csv' => $file,
        ])->assertSuccessful();

        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNotNull($volume->metadata_file_path);
    }

    public function testStoreImageMetadataInvalid()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
                'metadata_text' => "filename,yaw\nabc.jpg,400",
            ])
            ->assertStatus(422);
    }

    public function testStoreEmptyVideoMetadataText()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://videos',
                'media_type' => 'video',
                'files' => '1.mp4',
                'metadata_text' => "",
            ])
            ->assertSuccessful();

        $volume = $this->project()->volumes()->first();
        $this->assertNull($volume->metadata_file_path);
    }

    public function testStoreVideoMetadataText()
    {
        Storage::fake('metadata');
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://videos',
                'media_type' => 'video',
                'files' => '1.mp4',
                'metadata_text' => "filename,area\n1.mp4,2.5",
            ])
            ->assertSuccessful();

        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNotNull($volume->metadata_file_path);
    }

    public function testStoreVideoMetadataCsv()
    {
        Storage::fake('metadata');

        $id = $this->project()->id;
        $this->beAdmin();
        $csv = __DIR__."/../../../../files/video-metadata.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/abc.mp4', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://videos',
                'media_type' => 'video',
                'files' => 'abc.mp4',
                'metadata_csv' => $file,
            ])
            ->assertSuccessful();

        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNotNull($volume->metadata_file_path);
    }

    public function testStoreVideoMetadataInvalid()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://videos',
                'media_type' => 'video',
                'files' => '1.mp4',
                'metadata_text' => "filename,yaw\nabc.mp4,400",
            ])
            ->assertStatus(422);
    }

    public function testStoreProviderDenylist()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'https://dropbox.com',
                'media_type' => 'image',
                'files' => ['1.jpg', '2.jpg'],
            ])
            ->assertStatus(422);
    }

    public function testStoreAuthorizeDisk()
    {
        config(['volumes.admin_storage_disks' => ['admin-test']]);
        config(['volumes.editor_storage_disks' => ['editor-test']]);

        $adminDisk = Storage::fake('admin-test');
        $adminDisk->put('images/1.jpg', 'abc');

        $editorDisk = Storage::fake('editor-test');
        $editorDisk->put('images/2.jpg', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'name',
                'url' => 'admin-test://images',
                'media_type' => 'image',
                'files' => ['1.jpg'],
            ])
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'name',
                'url' => 'editor-test://images',
                'media_type' => 'image',
                'files' => ['2.jpg'],
            ])
            ->assertSuccessful();

        $this->beGlobalAdmin();
        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'name',
                'url' => 'admin-test://images',
                'media_type' => 'image',
                'files' => ['1.jpg'],
            ])
            ->assertSuccessful();

        $this
            ->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'name',
                'url' => 'editor-test://images',
                'media_type' => 'image',
                'files' => ['2.jpg'],
            ])
            ->assertStatus(422);
    }

    public function testAttach()
    {
        $tid = $this->volume->id;

        $secondProject = ProjectTest::create();
        $pid = $secondProject->id;

        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/volumes/{$tid}");

        $this->beAdmin();
        $response = $this->post("/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(403);

        $secondProject->addUserId($this->admin()->id, Role::adminId());
        Cache::flush();

        $this->assertEmpty($secondProject->fresh()->volumes);
        $response = $this->post("/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(200);
        $this->assertNotEmpty($secondProject->fresh()->volumes);
    }

    public function testAttachDuplicate()
    {
        $tid = $this->volume->id;
        $pid = $this->project()->id;

        $this->beAdmin();
        $this
            ->json('POST', "/api/v1/projects/{$pid}/volumes/{$tid}")
            ->assertStatus(200);
    }

    public function testDestroy()
    {
        $pid = $this->project()->id;
        $id = $this->volume->id;

        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$pid}/volumes/{$id}");

        $this->beUser();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        // trying to delete without force
        $response->assertStatus(400);

        $otherVolume = VolumeTest::create();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$otherVolume->id}");
        // does not belong to the project
        $response->assertStatus(404);

        Queue::fake();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}", [
            'force' => 'abc',
        ]);
        // deleting with force succeeds
        $response->assertStatus(200);
        Queue::assertPushed(DeleteVolume::class, fn ($job) => $id === $job->volume->id);
        $this->assertFalse($this->project()->volumes()->exists());
    }
}
