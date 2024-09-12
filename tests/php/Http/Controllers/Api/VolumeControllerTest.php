<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\CloneImagesOrVideos;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Queue;

class VolumeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $project = ProjectTest::create();
        $project->addVolumeId($this->volume()->id);

        $this->doTestApiRoute('GET', '/api/v1/volumes/');

        $this->beUser();
        $this
            ->get('/api/v1/volumes/')
            ->assertStatus(200)
            ->assertExactJson([]);

        $this->beGuest();
        $this
            ->get('/api/v1/volumes/')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $this->volume()->id])
            ->assertJsonFragment(['media_type_id' => $this->volume()->media_type_id])
            ->assertJsonFragment(['name' => $this->project()->name])
            // Only include projects to which the user has access.
            ->assertJsonMissing(['name' => $project->name]);
    }

    public function testIndexGlobalAdmin()
    {
        $project = ProjectTest::create();
        $project->addVolumeId($this->volume()->id);

        $this->beGlobalAdmin();
        $this
            ->get('/api/v1/volumes/')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $this->volume()->id])
            ->assertJsonFragment(['media_type_id' => $this->volume()->media_type_id])
            ->assertJsonFragment(['name' => $this->project()->name])
            ->assertJsonFragment(['name' => $project->name]);
    }

    public function testShow()
    {
        $project = ProjectTest::create();
        $id = $this->volume()->id;
        $project->addVolumeId($id);
        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $this
            ->get("/api/v1/volumes/{$id}")
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $this->volume()->id])
            ->assertJsonFragment(['media_type_id' => $this->volume()->media_type_id])
            ->assertJsonFragment(['name' => $this->project()->name])
            // Only include projects to which the user has access.
            ->assertJsonMissing(['name' => $project->name]);
    }

    public function testUpdate()
    {
        $id = $this->volume(['media_type_id' => MediaType::imageId()])->id;
        $this->doTestApiRoute('PUT', '/api/v1/volumes/'.$id);

        $this->beGuest();
        $response = $this->put('/api/v1/volumes/'.$id);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put('/api/v1/volumes/'.$id);
        $response->assertStatus(403);

        $this->beAdmin();
        $this->assertNotEquals('the new volume', $this->volume()->fresh()->name);
        $response = $this->json('PUT', '/api/v1/volumes/'.$id, [
            'name' => 'the new volume',
            'media_type_id' => MediaType::videoId(),
        ]);
        $response->assertStatus(200);
        $this->assertSame('the new volume', $this->volume()->fresh()->name);
        // Media type cannot be updated.
        $this->assertSame(MediaType::imageId(), $this->volume()->fresh()->media_type_id);
        Queue::assertNothingPushed();
    }

    public function testUpdateHandle()
    {
        $volume = $this->volume();
        $id = $volume->id;
        $this->doTestApiRoute('PUT', "/api/v1/volumes/{$id}");

        $this->beAdmin();
        $this
            ->json('PUT', "/api/v1/volumes/{$id}", [
                'handle' => 'https://doi.org/10.3389/fmars.2017.00083',
            ])
            ->assertStatus(422);

        $this
            ->json('PUT', "/api/v1/volumes/{$id}", [
                'handle' => '10.3389/fmars.2017.00083',
            ])
            ->assertStatus(200);
        $this->volume()->refresh();
        $this->assertSame('10.3389/fmars.2017.00083', $this->volume()->handle);

        // Some DOIs can contain multiple slashes.
        $this
            ->json('PUT', "/api/v1/volumes/{$id}", [
                'handle' => '10.3389/fmars.2017/00083',
            ])
            ->assertStatus(200);

        // Backwards compatibility.
        $this
            ->json('PUT', "/api/v1/volumes/{$id}", [
                'doi' => '10.3389/fmars.2017.00083',
            ])
            ->assertStatus(200);

        $this
            ->json('PUT', "/api/v1/volumes/{$id}", [
                'handle' => '',
            ])
            ->assertStatus(200);
        $this->volume()->refresh();
        $this->assertNull($this->volume()->handle);
    }

    public function testUpdateUrl()
    {
        config(['volumes.admin_storage_disks' => ['admin-test']]);
        config(['volumes.editor_storage_disks' => ['editor-test']]);

        $disk = Storage::fake('admin-test');
        $disk->put('volumes/file.txt', 'abc');

        $disk = Storage::fake('editor-test');
        $disk->put('volumes/file.txt', 'abc');

        $this->beAdmin();

        $this
            ->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
                'url' => 'admin-test://volumes',
            ])
            ->assertStatus(422);
        $this
            ->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
                'url' => 'editor-test://volumes',
            ])
            ->assertStatus(200);

        $this->assertSame('editor-test://volumes', $this->volume()->fresh()->url);

        $this->beGlobalAdmin();
        $this
            ->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
                'url' => 'editor-test://volumes',
            ])
            ->assertStatus(422);
        $this
            ->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
                'url' => 'admin-test://volumes',
            ])
            ->assertStatus(200);
        $this->assertSame('admin-test://volumes', $this->volume()->fresh()->url);
        Queue::assertPushed(ProcessNewVolumeFiles::class);
    }

    public function testUpdateInvalidUrl()
    {
        $volume = $this->volume();
        
        config(['volumes.admin_storage_disks' => ['admin-test']]);
        $disk = Storage::fake('admin-test');
        $disk->put('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/file.txt', 'abc');

        $this->beGlobalAdmin();
        
        // invalid url (>256 characters)
        $response = $this->json('PUT', '/api/v1/volumes/'.$volume->id, [
            'url' => 'admin-test://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        ])->assertStatus(422);
        
        $this->assertSame('The url must not be greater than 256 characters.', $response->exception->getMessage());
        Queue::assertNothingPushed();
    }

    public function testUpdateUrlProviderDenylist()
    {
        $this->beAdmin();
        $this
            ->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
                'url' => 'https://dropbox.com',
            ])
            ->assertStatus(422);
    }

    public function testUpdateGlobalAdmin()
    {
        $this->beGlobalAdmin();
        // A request that changes no attributes performed by a global admin triggers
        // a reread.
        $this
            ->json('PUT', '/api/v1/volumes/'.$this->volume()->id)
            ->assertStatus(200);
        Queue::assertPushed(ProcessNewVolumeFiles::class);
    }

    public function testUpdateValidation()
    {
        $id = $this->volume()->id;

        $this->beAdmin();
        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'name' => '',
        ]);
        // name must not be empty if present
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'url' => '',
        ]);
        // url must not be empty if present
        $response->assertStatus(422);
    }

    public function testUpdateRedirect()
    {
        $this->beAdmin();
        $response = $this->put('/api/v1/volumes/'.$this->volume()->id, [
            '_redirect' => 'settings/profile',
        ]);
        $response->assertRedirect('settings/profile');
        $response->assertSessionHas('saved', false);

        $this->get('/');
        $response = $this->put('/api/v1/volumes/'.$this->volume()->id, [
            'name' => 'abc',
        ]);
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);
    }

    public function testCloneVolume()
    {
        $volume = $this->volume(['metadata_file_path' => 'mymeta.csv']);
        $project = ProjectTest::create();

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");

        $this->be($project->creator);
        $this
            ->postJson("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}")
            // No update permissions in the source project.
            ->assertStatus(403);

        $this->beAdmin();
        $this
            ->postJson("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}")
            // No update permissions in the target project.
            ->assertStatus(403);

        $project->addUserId($this->admin()->id, Role::adminId());

        Cache::flush();

        $this
            ->postJson("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}")
            ->assertStatus(201);
        Queue::assertPushed(CloneImagesOrVideos::class);

        $this->assertTrue($project->volumes()->exists());
        $copy = $project->volumes()->first();
        $this->assertEquals($copy->name, $this->volume()->name);
        $this->assertEquals($copy->media_type_id, $this->volume()->media_type_id);
        $this->assertEquals($copy->url, $this->volume()->url);
        $this->assertTrue($copy->creating_async);
        $this->assertEquals("{$copy->id}.csv", $copy->metadata_file_path);
    }

    public function testCloneVolumeNewName()
    {
        $volume = $this->volume(['name' => 'myvolume']);
        $project = ProjectTest::create();
        $project->addUserId($this->admin()->id, Role::adminId());

        $this->beAdmin();

        $this
            ->postJson("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}", [
                'name' => 'volumecopy',
            ])
            ->assertStatus(201);
        $copy = $project->volumes()->first();
        $this->assertEquals($copy->name, 'volumecopy');
    }

    public function testGetImageIdsSortedByAnnotationTimestamps()
    {

        $volume = $this
            ->volume([
                'created_at' => '2022-11-09 14:37:00',
                'updated_at' => '2022-11-09 14:37:00',
            ])
            ->fresh();

        $this->be(UserTest::create());
        $this->getJson("/api/v1/volumes/{$volume->id}/files/annotation-timestamps")->assertForbidden();

        $this->beGuest();
        $response = $this->getJson("/api/v1/volumes/{$volume->id}/files/annotation-timestamps");

        $response->assertSuccessful();
        $content = json_decode($response->getContent(), true);

        $this->assertCount(0, $content);

        $img = ImageTest::create([
            'filename' => 'test123.jpg',
            'volume_id' => $volume->id,
        ]);
        ImageAnnotationTest::create([
            'created_at' => '2023-11-09 06:37:00',
            'image_id' => $img->id,
        ]);
        ImageAnnotationTest::create([
            'created_at' => '2020-11-09 06:37:00',
            'image_id' => $img->id,
        ]);
        $img2 = ImageTest::create([
            'filename' => 'test321.jpg',
            'volume_id' => $volume->id
        ]);
        ImageAnnotationTest::create([
            'created_at' => '2024-11-09 14:37:00',
            'image_id' => $img2->id,
        ]);
        $img3 = ImageTest::create([
            'filename' => 'test321321.jpg',
            'volume_id' => $volume->id
        ]);

        $response = $this->getJson("/api/v1/volumes/{$volume->id}/files/annotation-timestamps");

        $response->assertSuccessful();
        $content = json_decode($response->getContent(), true);

        $this->assertCount(3, $content);
        $this->assertSame($content[0], $img2->id);
        $this->assertSame($content[1], $img->id);
        $this->assertSame($content[2], $img3->id);
    }

    public function testGetVideoIdsSortedByAnnotationTimestamps()
    {

        $volume = $this
            ->volume([
                'created_at' => '2022-11-09 14:37:00',
                'updated_at' => '2022-11-09 14:37:00',
                'media_type_id' => MediaType::videoId()
            ])
            ->fresh();

        $this->be(UserTest::create());
        $this->getJson("/api/v1/volumes/{$volume->id}/files/annotation-timestamps")->assertForbidden();

        $this->beGuest();
        $response = $this->getJson("/api/v1/volumes/{$volume->id}/files/annotation-timestamps");

        $response->assertSuccessful();
        $content = json_decode($response->getContent(), true);

        $this->assertCount(0, $content);

        $video = VideoTest::create([
            'filename' => 'test123.jpg',
            'volume_id' => $volume->id,
        ]);
        VideoAnnotationTest::create([
            'created_at' => '2023-11-09 06:37:00',
            'video_id' => $video->id,
        ]);
        VideoAnnotationTest::create([
            'created_at' => '2020-11-09 06:37:00',
            'video_id' => $video->id,
        ]);
        $video2 = VideoTest::create([
            'filename' => 'test321.jpg',
            'volume_id' => $volume->id
        ]);
        VideoAnnotationTest::create([
            'created_at' => '2024-11-09 14:37:00',
            'video_id' => $video2->id,
        ]);
        $video3 = VideoTest::create([
            'filename' => 'test321123.jpg',
            'volume_id' => $volume->id
        ]);

        $response = $this->getJson("/api/v1/volumes/{$volume->id}/files/annotation-timestamps");

        $response->assertSuccessful();
        $content = json_decode($response->getContent(), true);

        $this->assertCount(3, $content);
        $this->assertSame($content[0], $video2->id);
        $this->assertSame($content[1], $video->id);
        $this->assertSame($content[2], $video3->id);
    }
}
