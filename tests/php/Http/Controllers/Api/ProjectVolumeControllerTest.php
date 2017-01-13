<?php

namespace Biigle\Tests\Http\Controllers\Api;

use File;
use Event;
use Cache;
use Biigle\Role;
use Biigle\Image;
use ApiTestCase;
use Biigle\Volume;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Services\Thumbnails\InterventionImage;

class ProjectVolumeControllerTest extends ApiTestCase
{
    private $volume;

    public function setUp()
    {
        parent::setUp();
        $this->volume = VolumeTest::create();
        $this->project()->volumes()->attach($this->volume);
    }

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/projects/1/volumes');

        $this->beUser();
        $this->get('/api/v1/projects/1/volumes');
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('/api/v1/projects/1/volumes');
        $content = $this->response->getContent();
        $this->assertResponseOk();
        // response should not be an empty array
        $this->assertStringStartsWith('[{', $content);
        $this->assertStringEndsWith('}]', $content);
        $this->assertNotContains('pivot', $content);
    }

    public function testStore()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('POST', '/api/v1/projects/'.$id.'/volumes');

        $this->beEditor();
        $this->post('/api/v1/projects/'.$id.'/volumes');
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('POST', '/api/v1/projects/'.$id.'/volumes');
        // mssing arguments
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/projects/'.$id.'/volumes', [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => 99999,
            'images' => '1.jpg, 2.jpg',
        ]);
        // media type does not exist
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/projects/'.$id.'/volumes', [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '',
        ]);
        // images array is empty
        $this->assertResponseStatus(422);

        $count = $this->project()->volumes()->count();
        $imageCount = Image::all()->count();

        $this->json('POST', '/api/v1/projects/'.$id.'/volumes', [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg, , 1.jpg',
        ]);
        // error because of duplicate image
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/projects/'.$id.'/volumes', [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.bmp',
        ]);
        // error because of unsupported image format
        $this->assertResponseStatus(422);

        File::shouldReceive('exists')->times(3)->andReturn(false, true, true);
        File::shouldReceive('isReadable')->twice()->andReturn(false, true);

        $this->json('POST', '/api/v1/projects/'.$id.'/volumes', [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg',
        ]);
        // volume url does not exist
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/projects/'.$id.'/volumes', [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg',
        ]);
        // volume url is not readable
        $this->assertResponseStatus(422);

        $this->assertEquals($count, $this->project()->volumes()->count());
        $this->assertEquals($imageCount, Image::all()->count());

        $this->expectsJobs(\Biigle\Jobs\GenerateThumbnails::class);

        $this->json('POST', '/api/v1/projects/'.$id.'/volumes', [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            // empty parts should be discarded
            'images' => '1.jpg, , 2.jpg, , ,',
        ]);
        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertEquals($count + 1, $this->project()->volumes()->count());
        $this->assertEquals($imageCount + 2, Image::all()->count());
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);

        $id = json_decode($content)->id;
        $volume = Volume::find($id);
        $this->assertTrue($volume->images()->where('filename', '1.jpg')->exists());
        $this->assertTrue($volume->images()->where('filename', '2.jpg')->exists());
    }

    public function testAttach()
    {
        $tid = $this->volume->id;

        $secondProject = ProjectTest::create();
        $pid = $secondProject->id;
        // $secondProject->addUserId($this->admin()->id, Role::$admin->id);

        $this->doTestApiRoute('POST', '/api/v1/projects/'.$pid.'/volumes/'.$tid);

        $this->beAdmin();
        $this->post('/api/v1/projects/'.$pid.'/volumes/'.$tid);
        $this->assertResponseStatus(403);

        $secondProject->addUserId($this->admin()->id, Role::$admin->id);
        Cache::flush();

        $this->assertEmpty($secondProject->fresh()->volumes);
        $this->post('/api/v1/projects/'.$pid.'/volumes/'.$tid);
        $this->assertResponseOk();
        $this->assertNotEmpty($secondProject->fresh()->volumes);
    }

    public function testAttachDuplicate()
    {
        $tid = $this->volume->id;
        $pid = $this->project()->id;

        $this->beAdmin();
        $this->json('POST', '/api/v1/projects/'.$pid.'/volumes/'.$tid);
        $this->assertResponseStatus(422);
    }

    public function testDestroy()
    {
        $id = $this->volume->id;
        $image = ImageTest::create(['volume_id' => $id]);

        $this->doTestApiRoute('DELETE', '/api/v1/projects/1/volumes/'.$id);

        $this->beUser();
        $this->delete('/api/v1/projects/1/volumes/'.$id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->delete('/api/v1/projects/1/volumes/'.$id);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->delete('/api/v1/projects/1/volumes/'.$id);
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->delete('/api/v1/projects/1/volumes/'.$id);
        // trying to delete without force
        $this->assertResponseStatus(400);

        $otherVolume = VolumeTest::create();
        $this->delete('/api/v1/projects/1/volumes/'.$otherVolume->id);
        // does not belong to the project
        $this->assertResponseStatus(404);

        Event::shouldReceive('fire')
            ->once()
            ->with('images.cleanup', [[$image->uuid]]);

        Event::shouldReceive('fire'); // catch other events

        $this->delete('/api/v1/projects/1/volumes/'.$id, [
            'force' => 'abc',
        ]);
        // deleting with force succeeds
        $this->assertResponseOk();
        $this->assertNull($this->volume->fresh());
    }
}
