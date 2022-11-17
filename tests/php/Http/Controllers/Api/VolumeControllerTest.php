<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationSession;
use Biigle\Image;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Role;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoLabel;
use Biigle\Volume;
use Carbon\Carbon;
use http\Env\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Arr;
use function PHPUnit\Framework\assertTrue;

class VolumeControllerTest extends ApiTestCase
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
        $this->doTestApiRoute('PUT', '/api/v1/volumes/' . $id);

        $this->beGuest();
        $response = $this->put('/api/v1/volumes/' . $id);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put('/api/v1/volumes/' . $id);
        $response->assertStatus(403);

        $this->beAdmin();
        $this->assertNotEquals('the new volume', $this->volume()->fresh()->name);
        $response = $this->json('PUT', '/api/v1/volumes/' . $id, [
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
        $this->json('PUT', '/api/v1/volumes/' . $this->volume()->id, [
            'url' => 'admin-test://volumes',
        ])->assertStatus(422);
        $this->json('PUT', '/api/v1/volumes/' . $this->volume()->id, [
            'url' => 'editor-test://volumes',
        ])->assertStatus(200);
        $this->assertEquals('editor-test://volumes', $this->volume()->fresh()->url);

        $this->beGlobalAdmin();
        $this->json('PUT', '/api/v1/volumes/' . $this->volume()->id, [
            'url' => 'editor-test://volumes',
        ])->assertStatus(422);
        $this->json('PUT', '/api/v1/volumes/' . $this->volume()->id, [
            'url' => 'admin-test://volumes',
        ])->assertStatus(200);
        $this->assertEquals('admin-test://volumes', $this->volume()->fresh()->url);
    }

    public function testUpdateUrlProviderDenylist()
    {
        $this->beAdmin();
        $this->json('PUT', '/api/v1/volumes/' . $this->volume()->id, [
            'url' => 'https://dropbox.com',
        ])->assertStatus(422);
    }

    public function testUpdateGlobalAdmin()
    {
        $this->beGlobalAdmin();
        // A request that changes no attributes performed by a global admin triggers
        // a reread.
        $this->expectsJobs(ProcessNewVolumeFiles::class);
        $this->json('PUT', '/api/v1/volumes/' . $this->volume()->id)
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
        $response = $this->put('/api/v1/volumes/' . $this->volume()->id, [
            '_redirect' => 'settings/profile',
        ]);
        $response->assertRedirect('settings/profile');
        $response->assertSessionHas('saved', false);

        $this->get('/');
        $response = $this->put('/api/v1/volumes/' . $this->volume()->id, [
            'name' => 'abc',
        ]);
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);
    }

    public function testCloneVolumeApi()
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

    }

    public function testCloneVolume()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',

        ])->fresh(); // Use fresh() to load even the null fields.

        // The target project.
        $project = ProjectTest::create();

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $response->getSession()->get('copy');

        $this->assertNotEquals($volume->id, $copy->id);
        $this->assertNotEquals($volume->created_at, $copy->created_at);
        $this->assertNotEquals($volume->updated_at, $copy->updated_at);

        $this->assertEquals($volume->name, $copy->name);
        $this->assertEquals($volume->creator()->first()->id, $copy->creator()->first()->id);
        $this->assertEquals($volume->mediaType()->get(), $copy->mediaType()->get());
        $this->assertEquals($copy->projects()->count(), $volume->projects()->count());
        $this->assertEquals($copy->projects()->first()->id, $project->id);
        $this->assertEquals($volume->url, $copy->url);
        $this->assertEquals($volume->handle, $copy->handle);
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
        $copy = $response->getSession()->get('copy');
        $newImage = $copy->images()->first();

        $this->assertTrue($copy->images()->exists());
        $this->assertEquals($volume->images()->count(), $copy->images()->count());
        $this->assertNotEquals($newImage->id, $oldImage->id);
        $this->assertNotEquals($newImage->uuid, $oldImage->uuid);
        $this->assertEquals($newImage->volume_id, $copy->id);

        unset($newImage->id);
        unset($oldImage->id);
        unset($newImage->volume_id);
        unset($oldImage->volume_id);
        unset($oldImage->uuid);
        unset($newImage->uuid);

        $this->assertEquals($oldImage->getAttributes(), $newImage->getAttributes());

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
        $copy = $response->getSession()->get('copy');
        $newVideo = $copy->videos()->first();

        $this->assertTrue($copy->videos()->exists());
        $this->assertEquals($volume->videos()->count(), $copy->videos()->count());
        $this->assertNotEquals($newVideo->id, $oldVideo->id);
        $this->assertNotEquals($newVideo->uuid, $oldVideo->uuid);
        $this->assertEquals($newVideo->volume_id, $copy->id);

        unset($newVideo->id);
        unset($oldVideo->id);
        unset($newVideo->volume_id);
        unset($oldVideo->volume_id);
        unset($oldVideo->uuid);
        unset($newVideo->uuid);

        $this->assertEquals($oldVideo->getAttributes(), $newVideo->getAttributes());

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

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $response->getSession()->get('copy');
        $newImage = $copy->images()->first();
        $newAnnotation = $newImage->annotations()->first();

        $this->assertNotEquals($oldAnnotation->id, $newAnnotation->id);
        $this->assertEquals($oldAnnotation->updated_at, $newAnnotation->updated_at);
        $this->assertEquals($oldAnnotation->created_at, $newAnnotation->created_at);

        unset($oldAnnotation->id);
        unset($newAnnotation->id);
        unset($oldAnnotation->image_id);
        unset($newAnnotation->image_id);

        $this->assertEquals($oldAnnotation->getAttributes(), $newAnnotation->getAttributes());

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
        $copy = $response->getSession()->get('copy');
        $newVideo = $copy->videos()->first();
        $newAnnotation = $newVideo->annotations()->first();

        $this->assertNotEquals($oldAnnotation->id, $newAnnotation->id);
        $this->assertEquals($oldAnnotation->updated_at, $newAnnotation->updated_at);
        $this->assertEquals($oldAnnotation->created_at, $newAnnotation->created_at);

        unset($oldAnnotation->id);
        unset($newAnnotation->id);
        unset($oldAnnotation->video_id);
        unset($newAnnotation->video_id);

        $this->assertEquals($oldAnnotation->getAttributes(), $newAnnotation->getAttributes());

    }

    public function testCloneVolumeImageAnnotationLabels()
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
        $copy = $response->getSession()->get('copy');
        $newAnnotation = $copy->images()->first()->annotations()->first();
        $newAnnotationLabel = $newAnnotation->labels()->first();

        $this->assertNotEquals($oldAnnotationLabel->id, $newAnnotationLabel->id);
        $this->assertEquals($newAnnotationLabel->annotation_id, $newAnnotation->id);

        unset($oldAnnotationLabel->id);
        unset($newAnnotationLabel->id);
        unset($oldAnnotationLabel->annotation_id);
        unset($newAnnotationLabel->annotation_id);

        $this->assertEquals($oldAnnotationLabel->getAttributes(), $newAnnotationLabel->getAttributes());
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
        $copy = $response->getSession()->get('copy');
        $newAnnotation = $copy->videos()->first()->annotations()->first();
        $newAnnotationLabel = $newAnnotation->labels()->first();

        $this->assertNotEquals($oldAnnotationLabel->id, $newAnnotationLabel->id);
        $this->assertEquals($newAnnotationLabel->annotation_id, $newAnnotation->id);

        unset($oldAnnotationLabel->id);
        unset($newAnnotationLabel->id);
        unset($oldAnnotationLabel->annotation_id);
        unset($newAnnotationLabel->annotation_id);

        $this->assertEquals($oldAnnotationLabel->getAttributes(), $newAnnotationLabel->getAttributes());
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
        $oldImageLabel = ImageLabelTest::create(['image_id' => $oldImage->id]);

        $this->beAdmin();
        $project->addUserId($this->admin()->id, Role::adminId());

        $response = $this->post("/api/v1/volumes/{$volume->id}/clone-to/{$project->id}");
        $response->assertStatus(302);
        $copy = $response->getSession()->get('copy');
        $newImage = $copy->images()->first();
        $newImageLabel = $newImage->labels()->first();

        $this->assertNotEquals($oldImageLabel->id, $newImageLabel->id);
        $this->assertNotEquals($oldImageLabel->image_id, $newImageLabel->image_id);

        unset($newImageLabel->id);
        unset($oldImageLabel->id);
        unset($newImageLabel->image_id);
        unset($oldImageLabel->image_id);

        $this->assertEquals($oldImageLabel->getAttributes(), $newImageLabel->getAttributes());
    }
//
//    public function testCloneVolumeVideoLabels(){}
//
//    public function testCloneVolumeIfDoFiles(){}


    //TODO: add javadocs
    //TODO: split test
    public function testCloneImageVolume()
    {
        $this->volume = VolumeTest::create(['media_type_id' => MediaType::imageId()]);
        $id = $this->volume->id;

        $disk = Storage::fake('ifdos');
        $csv = __DIR__ . "/../../../../files/image-ifdo.yaml";
        $file = new UploadedFile($csv, 'ifdo.yaml', 'application/yaml', null, true);
        $this->volume->saveIfdo($file);

        $project = ProjectTest::create();
        $id2 = $project->id;

        $this->volume->projects()->attach($id2);

        $this->beAdmin();

        $img1 = ImageTest::create([
            'lng' => 1.5,
            'lat' => 5.3,
            'filename' => 'a.jpg',
            'volume_id' => $this->volume->id,
        ]);

        $img2 = ImageTest::create([
            'lng' => 9.5,
            'lat' => 9.0,
            'filename' => 'b.jpg',
            'volume_id' => $this->volume->id,
        ]);

        $img3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $this->volume->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);
        $u1 = UserTest::create();
        $u2 = UserTest::create();
        $u3 = UserTest::create();
        $session->users()->attach($this->admin()->id);
        $session->users()->attach($u1);
        $session->users()->attach($u2);
        $session->users()->attach($u3);


        $project->addUserId($this->admin()->id, Role::adminId());
        Cache::flush();

        $response = $this->post("/api/v1/volumes/{$id}/clone-to/{$id2}");
        $response->assertStatus(302);


        $copy = $response->getSession()->get('copy');

        $oldSessions = AnnotationSession::whereIn('volume_id', [$this->volume->id]);
        $newSessions = AnnotationSession::whereIn('volume_id', [$copy->id]);

        $this->assertTrue($oldSessions->exists() == $newSessions->exists());

        foreach ($oldSessions->get() as $idx => $oldSession) {
            $newSession = $newSessions->get()[$idx];
            $oldUsers = $oldSession->users()->get();
            $newUsers = $newSession->users()->get();
            foreach ($oldUsers as $userIdx => $oldUser) {
                $newUser = $newUsers[$userIdx];
                $this->assertEquals($oldUser->getAttributes(), $newUser->getAttributes());
            }
            $this->assertTrue($oldSession->volume_id == $this->volume->id);
            $this->assertTrue($newSession->volume_id == $copy->id);
            unset($oldSession->id);
            unset($oldSession->volume_id);
            unset($newSession->id);
            unset($newSession->volume_id);
            $this->assertEquals($oldSession->getAttributes(), $newSession->getAttributes());
        }

        $this->assertTrue($copy->hasIfdo() == $this->volume->hasIfdo());
        $this->assertTrue($copy->getIfdo() == $this->volume->getIfdo());

    }

    //TODO: add javadocs
    //TODO: split test
    public function testCloneVideoVolume()
    {
        $this->volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $id = $this->volume->id;

        $disk = Storage::fake('ifdos');
        $csv = __DIR__ . "/../../../../files/video-ifdo.yaml";
        $file = new UploadedFile($csv, 'ifdo.yaml', 'application/yaml', null, true);
        $this->volume->saveIfdo($file);

        $project = ProjectTest::create();
        $id2 = $project->id;

        $this->volume->projects()->attach($id2);

        $this->beAdmin();

        $v1 = VideoTest::create([
            'filename' => 'a.mp4',
            'volume_id' => $this->volume->id,
            'lng' => 9.9,
            'lat' => 4.333,
        ]);

        $v2 = VideoTest::create([
            'filename' => 'b.mp4',
            'volume_id' => $this->volume->id,
            'lng' => 0.12,
            'lat' => 43,
        ]);

        $v3 = VideoTest::create([
            'filename' => 'c.mp4',
            'volume_id' => $this->volume->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $u1 = UserTest::create();
        $u2 = UserTest::create();
        $u3 = UserTest::create();
        $session->users()->attach($this->admin()->id);
        $session->users()->attach($u1);
        $session->users()->attach($u2);
        $session->users()->attach($u3);

        $project->addUserId($this->admin()->id, Role::adminId());
        Cache::flush();

        $response = $this->post("/api/v1/volumes/{$id}/clone-to/{$id2}");
        $response->assertStatus(302);


        $copy = $response->getSession()->get('copy');


        foreach ($this->volume->videos()->get() as $index => $oldVideo) {

            $newVideoLabels = $newVideo->labels()->get();
            foreach ($oldVideo->labels()->get() as $vlIdx => $oldVideoLabel) {
                $newVideoLabel = $newVideoLabels[$vlIdx];
                $this->assertTrue($oldVideoLabel->video_id == $oldVideo->id);
                $this->assertTrue($newVideoLabel->video_id == $newVideo->id);
                unset($oldVideoLabel->id);
                unset($oldVideoLabel->video_id);
                unset($newVideoLabel->id);
                unset($newVideoLabel->video_id);
                $this->assertEquals($oldVideoLabel->getAttributes(), $newVideoLabel->getAttributes());
            }
        }

        $oldSessions = AnnotationSession::whereIn('volume_id', [$this->volume->id]);
        $newSessions = AnnotationSession::whereIn('volume_id', [$copy->id]);

        $this->assertTrue($oldSessions->exists() == $newSessions->exists());

        foreach ($oldSessions->get() as $idx => $oldSession) {
            $newSession = $newSessions->get()[$idx];
            $oldUsers = $oldSession->users()->get();
            $newUsers = $newSession->users()->get();
            foreach ($oldUsers as $userIdx => $oldUser) {
                $newUser = $newUsers[$userIdx];
                $this->assertEquals($oldUser->getAttributes(), $newUser->getAttributes());
            }
            $this->assertTrue($oldSession->volume_id == $this->volume->id);
            $this->assertTrue($newSession->volume_id == $copy->id);
            unset($oldSession->id);
            unset($oldSession->volume_id);
            unset($newSession->id);
            unset($newSession->volume_id);
            $this->assertEquals($oldSession->getAttributes(), $newSession->getAttributes());
        }
        $this->assertTrue($copy->hasIfdo() == $this->volume->hasIfdo());
        $this->assertTrue($copy->getIfdo() == $this->volume->getIfdo());

    }
}
