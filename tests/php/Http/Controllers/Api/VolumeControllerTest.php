<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class VolumeControllerTest extends ApiTestCase
{

    public function testIndex()
    {
        $project = ProjectTest::create();
        $project->addVolumeId($this->volume()->id);

        $this->doTestApiRoute('GET', '/api/v1/volumes/');

        $this->beUser();
        $this->get('/api/v1/volumes/')
            ->assertStatus(200)
            ->assertExactJson([]);

        $this->beGuest();
        $this->get('/api/v1/volumes/')
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
        $this->get('/api/v1/volumes/')
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
        $this->get("/api/v1/volumes/{$id}")
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $this->volume()->id])
            ->assertJsonFragment(['media_type_id' => $this->volume()->media_type_id])
            ->assertJsonFragment(['name' => $this->project()->name])
            // Only include projects to which the user has access.
            ->assertJsonMissing(['name' => $project->name]);
    }

    public function testUpdate()
    {
        $this->doesntExpectJobs(ProcessNewVolumeFiles::class);

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
        $this->assertEquals('the new volume', $this->volume()->fresh()->name);
        // Media type cannot be updated.
        $this->assertEquals(MediaType::imageId(), $this->volume()->fresh()->media_type_id);
    }

    public function testUpdateHandle()
    {
        $volume = $this->volume();
        $id = $volume->id;
        $this->doTestApiRoute('PUT', "/api/v1/volumes/{$id}");

        $this->beAdmin();
        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'handle' => 'https://doi.org/10.3389/fmars.2017.00083',
        ])->assertStatus(422);

        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'handle' => '10.3389/fmars.2017.00083',
        ])->assertStatus(200);
        $this->volume()->refresh();
        $this->assertEquals('10.3389/fmars.2017.00083', $this->volume()->handle);

        // Some DOIs can contain multiple slashes.
        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'handle' => '10.3389/fmars.2017/00083',
        ])->assertStatus(200);

        // Backwards compatibility.
        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'doi' => '10.3389/fmars.2017.00083',
        ])->assertStatus(200);

        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'handle' => '',
        ])->assertStatus(200);
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
        $this->expectsJobs(ProcessNewVolumeFiles::class);
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => 'admin-test://volumes',
        ])->assertStatus(422);
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => 'editor-test://volumes',
        ])->assertStatus(200);
        $this->assertEquals('editor-test://volumes', $this->volume()->fresh()->url);

        $this->beGlobalAdmin();
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => 'editor-test://volumes',
        ])->assertStatus(422);
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => 'admin-test://volumes',
        ])->assertStatus(200);
        $this->assertEquals('admin-test://volumes', $this->volume()->fresh()->url);
    }

    public function testUpdateUrlProviderDenylist()
    {
        $this->beAdmin();
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => 'https://dropbox.com',
        ])->assertStatus(422);
    }

    public function testUpdateGlobalAdmin()
    {
        $this->beGlobalAdmin();
        // A request that changes no attributes performed by a global admin triggers
        // a reread.
        $this->expectsJobs(ProcessNewVolumeFiles::class);
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id)
            ->assertStatus(200);
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
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");

        $this->be($project->creator);
        $this->postJson("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}")
            // No update permissions in the source project.
            ->assertStatus(403);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}")
            // No update permissions in the target project.
            ->assertStatus(403);

        $project->addUserId($this->admin()->id, Role::adminId());
        Cache::flush();
        $this->postJson("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}")
            ->assertStatus(200);

        // The target project.
        $project = ProjectTest::create();

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();

        $this->assertNotNull($copy);
        $this->assertNotEquals($copy->id, $volume->id);
        $this->assertNotEquals($copy->created_at, $volume->created_at);
        $this->assertNotEquals($copy->updated_at, $volume->updated_at);

        $ignore = ['id', 'created_at', 'updated_at'];
        $this->assertEquals(
            $copy->makeHidden($ignore)->toArray(),
            $volume->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVolumeImages()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $oldImage = ImageTest::create([
            'filename' => 'a.jpg',
            'taken_at' => Carbon::now()->setTimezone('Europe/Lisbon'),
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'tiled' => true])->fresh();

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();
        $newImage = $copy->images()->first();

        $this->assertNotNull($newImage);
        $this->assertEquals($copy->images()->count(), $volume->images()->count());
        $this->assertNotEquals($newImage->id, $oldImage->id);
        $this->assertNotEquals($newImage->uuid, $oldImage->uuid);
        $this->assertEquals($newImage->volume_id, $copy->id);

        $ignore = ['id', 'volume_id', 'uuid'];
        $this->assertEquals(
            $newImage->makeHidden($ignore)->toArray(),
            $oldImage->makeHidden($ignore)->toArray()
        );

    }

    public function testCloneVolumeVideos()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
            'media_type_id' => MediaType::videoId()
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $oldVideo = VideoTest::create([
            'filename' => 'a.jpg',
            'taken_at' => [Carbon::now()->setTimezone('Europe/Lisbon')],
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'duration' => 42.42])->fresh();

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();
        $newVideo = $copy->videos()->first();

        $this->assertNotNull($newVideo);
        $this->assertEquals($copy->videos()->count(), $volume->videos()->count());
        $this->assertNotEquals($newVideo->id, $oldVideo->id);
        $this->assertNotEquals($newVideo->uuid, $oldVideo->uuid);
        $this->assertEquals($newVideo->volume_id, $copy->id);

        $ignore = ['id', 'volume_id', 'uuid'];
        $this->assertEquals(
            $newVideo->makeHidden($ignore)->toArray(),
            $oldVideo->makeHidden($ignore)->toArray()
        );

    }

    public function testCloneVolumeImageAnnotations()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldImage = ImageTest::create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = ImageAnnotationTest::create(['image_id' => $oldImage->id]);
        $oldAnnotationLabel = ImageAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();
        $newImage = $copy->images()->first();
        $newAnnotation = $newImage->annotations()->first();
        $newAnnotationLabel = $newAnnotation->labels()->first();

        $this->assertNotNull($newAnnotation);
        $this->assertNotNull($newAnnotationLabel);
        $this->assertNotEquals($newAnnotation->id, $oldAnnotation->id);
        $this->assertEquals($newAnnotation->updated_at, $oldAnnotation->updated_at);
        $this->assertEquals($newAnnotation->created_at, $oldAnnotation->created_at);
        $this->assertNotEquals($newAnnotation->image_id, $oldAnnotation->image_id);
        $this->assertEquals($newImage->id, $newAnnotation->image_id);
        $this->assertNotEquals($newAnnotationLabel->id, $oldAnnotationLabel->id);
        $this->assertEquals($newAnnotationLabel->annotation_id, $newAnnotation->id);

        $ignore = ['id', 'image_id'];
        $this->assertEquals(
            $newAnnotation->makeHidden($ignore)->toArray(),
            $oldAnnotation->makeHidden($ignore)->toArray()
        );

        $ignore = ['id', 'annotation_id'];
        $this->assertEquals(
            $newAnnotationLabel->makeHidden($ignore)->toArray(),
            $oldAnnotationLabel->makeHidden($ignore)->toArray()
        );

    }

    public function testCloneVolumeVideoAnnotations()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
            'media_type_id' => MediaType::videoId()
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = VideoAnnotationTest::create(['video_id' => $oldVideo->id]);

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();
        $newVideo = $copy->videos()->first();
        $newAnnotation = $newVideo->annotations()->first();

        $this->assertNotNull($newAnnotation);
        $this->assertNotEquals($newAnnotation->id, $oldAnnotation->id);
        $this->assertEquals($newAnnotation->updated_at, $oldAnnotation->updated_at);
        $this->assertEquals($newAnnotation->created_at, $oldAnnotation->created_at);
        $this->assertNotEquals($newAnnotation->video_id, $oldAnnotation->video_id);
        $this->assertEquals($newAnnotation->video_id, $newVideo->id);

        $ignore = ['id', 'video_id'];
        $this->assertEquals(
            $oldAnnotation->makeHidden($ignore)->toArray(),
            $newAnnotation->makeHidden($ignore)->toArray()
        );

    }

    public function testCloneVolumeVideoAnnotationLabels()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
            'media_type_id' => MediaType::videoId()
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = VideoAnnotationTest::create(['video_id' => $oldVideo->id]);
        $oldAnnotationLabel = VideoAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();
        $newAnnotation = $copy->videos()->first()->annotations()->first();
        $newAnnotationLabel = $newAnnotation->labels()->first();

        $this->assertNotNull($newAnnotationLabel);
        $this->assertNotEquals($newAnnotationLabel->id, $oldAnnotationLabel->id);
        $this->assertEquals($newAnnotationLabel->annotation_id, $newAnnotation->id);


        $ignore = ['id', 'annotation_id'];
        $this->assertEquals(
            $newAnnotationLabel->makeHidden($ignore)->toArray(),
            $oldAnnotationLabel->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVolumeImageLabels()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldImage = ImageTest::create(['volume_id' => $volume->id])->fresh();
        ImageLabelTest::create(['image_id' => $oldImage->id]);
        $oldImageLabel = $oldImage->labels()->first();

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();
        $newImage = $copy->images()->first();
        $newImageLabel = $newImage->labels()->first();

        $this->assertNotNull($newImageLabel);
        $this->assertNotEquals($newImageLabel->id, $oldImageLabel->id);
        $this->assertNotEquals($newImageLabel->image_id, $oldImageLabel->image_id);


        $ignore = ['id', 'image_id'];
        $this->assertEquals(
            $oldImageLabel->makeHidden($ignore)->toArray(),
            $newImageLabel->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVolumeVideoLabels()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
            'media_type_id' => MediaType::videoId()
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create(['volume_id' => $volume->id])->fresh();
        VideoLabelTest::create(['video_id' => $oldVideo->id]);
        $oldVideoLabel = $oldVideo->labels()->first();

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();
        $newVideo = $copy->videos()->first();
        $newVideoLabel = $newVideo->labels()->first();

        $this->assertNotNull($newVideoLabel);
        $this->assertNotEquals($newVideoLabel->id, $oldVideoLabel->id);
        $this->assertNotEquals($newVideoLabel->video_id, $oldVideoLabel->video_id);

        $ignore = ['id', 'video_id'];
        $this->assertEquals(
            $newVideoLabel->makeHidden($ignore)->toArray(),
            $oldVideoLabel->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVolumeIfDoFiles()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh();
        // Use fresh() to load even the null fields.

        Storage::fake('ifdos');
        $csv = __DIR__."/../../../../files/image-ifdo.yaml";
        $file = new UploadedFile($csv, 'ifdo.yaml', 'application/yaml', null, true);
        $volume->saveIfdo($file);

        // The target project.
        $project = ProjectTest::create();

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $project->volumes()->first();

        $this->assertNotNull($copy->getIfdo());
        $this->assertTrue($copy->hasIfdo());
        $this->assertEquals($volume->getIfdo(), $copy->getIfdo());
    }

}
