<?php

use Dias\MediaType;
use Dias\Transect;
use Dias\Role;
use Dias\Image;
use Dias\Services\Thumbnails\InterventionImage;

class ApiProjectTransectControllerTest extends ApiTestCase
{
    private $transect;

    public function setUp()
    {
        parent::setUp();
        $this->transect = TransectTest::create();
        $this->project()->addTransectId($this->transect->id);
    }

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/projects/1/transects');

        $this->beUser();
        $this->get('/api/v1/projects/1/transects');
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('/api/v1/projects/1/transects');
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
        $this->doTestApiRoute('POST', '/api/v1/projects/'.$id.'/transects');

        $this->beEditor();
        $this->post('/api/v1/projects/'.$id.'/transects');
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('POST', '/api/v1/projects/'.$id.'/transects');
        // mssing arguments
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/projects/'.$id.'/transects', [
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => 99999,
            'images' => '1.jpg, 2.jpg',
        ]);
        // media type does not exist
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/projects/'.$id.'/transects', [
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '',
        ]);
        // images array is empty
        $this->assertResponseStatus(422);

        $count = $this->project()->transects()->count();
        $imageCount = Image::all()->count();

        $this->json('POST', '/api/v1/projects/'.$id.'/transects', [
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg, , 1.jpg',
        ]);
        // error because of duplicate image
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/projects/'.$id.'/transects', [
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.bmp',
        ]);
        // error because of unsupported image format
        $this->assertResponseStatus(422);

        $this->assertEquals($count, $this->project()->transects()->count());
        $this->assertEquals($imageCount, Image::all()->count());

        $this->expectsJobs(\Dias\Jobs\GenerateThumbnails::class);

        $this->json('POST', '/api/v1/projects/'.$id.'/transects', [
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            // empty parts should be discarded
            'images' => '1.jpg, , 2.jpg, , ,',
        ]);
        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertEquals($count + 1, $this->project()->transects()->count());
        $this->assertEquals($imageCount + 2, Image::all()->count());
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);

        $id = json_decode($content)->id;
        $transect = Transect::find($id);
        $this->assertTrue($transect->images()->where('filename', '1.jpg')->exists());
        $this->assertTrue($transect->images()->where('filename', '2.jpg')->exists());
    }

    public function testAttach()
    {
        $tid = $this->transect->id;

        $secondProject = ProjectTest::create();
        $pid = $secondProject->id;
        // $secondProject->addUserId($this->admin()->id, Role::$admin->id);

        $this->doTestApiRoute('POST', '/api/v1/projects/'.$pid.'/transects/'.$tid);

        $this->beAdmin();
        $this->post('/api/v1/projects/'.$pid.'/transects/'.$tid);
        $this->assertResponseStatus(403);

        $secondProject->addUserId($this->admin()->id, Role::$admin->id);
        Cache::flush();

        $this->assertEmpty($secondProject->fresh()->transects);
        $this->post('/api/v1/projects/'.$pid.'/transects/'.$tid);
        $this->assertResponseOk();
        $this->assertNotEmpty($secondProject->fresh()->transects);
    }

    public function testDestroy()
    {
        $id = $this->transect->id;

        $this->doTestApiRoute('DELETE', '/api/v1/projects/1/transects/'.$id);

        $this->beUser();
        $this->delete('/api/v1/projects/1/transects/'.$id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->delete('/api/v1/projects/1/transects/'.$id);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->delete('/api/v1/projects/1/transects/'.$id);
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->delete('/api/v1/projects/1/transects/'.$id);
        // trying to delete without force
        $this->assertResponseStatus(400);

        $otherTransect = TransectTest::create();
        $this->delete('/api/v1/projects/1/transects/'.$otherTransect->id);
        // does not belong to the project
        $this->assertResponseStatus(404);

        $this->expectsEvents('images.cleanup');

        $this->delete('/api/v1/projects/1/transects/'.$id, [
            'force' => 'abc',
        ]);
        // deleting with force succeeds
        $this->assertResponseOk();
        $this->assertNull($this->transect->fresh());
    }
}
