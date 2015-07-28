<?php

use Dias\MediaType;
use Dias\Transect;
use Dias\Role;
use Dias\Image;

class ApiProjectTransectControllerTest extends ApiTestCase
{
    private $transect;

    public function setUp()
    {
        parent::setUp();

        $this->transect = TransectTest::create('test', base_path().'/tests/files');
        $this->transect->save();
        $this->project->addTransectId($this->transect->id);
    }

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/projects/1/transects');

        // api key authentication
        $this->callToken('GET', '/api/v1/projects/1/transects', $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('GET', '/api/v1/projects/1/transects', $this->guest);
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->guest);
        $r = $this->call('GET', '/api/v1/projects/1/transects');
        $this->assertResponseOk();
        // response should not be an empty array
        $this->assertStringStartsWith('[{', $r->getContent());
        $this->assertStringEndsWith('}]', $r->getContent());
        $this->assertNotContains('pivot', $r->getContent());
    }

    public function testStore()
    {
        $id = $this->project->id;
        $this->doTestApiRoute('POST', '/api/v1/projects/'.$id.'/transects');

        // api key authentication
        $this->callToken('POST', '/api/v1/projects/'.$id.'/transects', $this->editor);
        $this->assertResponseStatus(401);

        $this->callToken('POST', '/api/v1/projects/'.$id.'/transects', $this->admin);
        // mssing arguments
        $this->assertResponseStatus(422);

        // session cookie authentication
        $this->be($this->admin);
        $this->callAjax('POST', '/api/v1/projects/'.$id.'/transects', [
            '_token' => Session::token(),
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => 99999,
            'images' => '1.jpg, 2.jpg',
        ]);
        // media type does not exist
        $this->assertResponseStatus(422);

        $this->callAjax('POST', '/api/v1/projects/'.$id.'/transects', [
            '_token' => Session::token(),
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::timeSeriesId(),
            'images' => '',
        ]);
        // images array is empty
        $this->assertResponseStatus(422);

        $count = $this->project->transects()->count();
        $imageCount = Image::all()->count();

        $r = $this->callAjax('POST', '/api/v1/projects/'.$id.'/transects', [
            '_token' => Session::token(),
            'name' => 'my transect no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::timeSeriesId(),
            // empty parts should be discarded
            'images' => '1.jpg, , 2.jpg, , ,',
        ]);
        $this->assertResponseOk();
        $this->assertEquals($count + 1, $this->project->transects()->count());
        $this->assertEquals($imageCount + 2, Image::all()->count());
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());

        $id = json_decode($r->getContent())->id;
        $transect = Transect::find($id);
        $this->assertEquals('1.jpg', $transect->images()->first()->filename);
    }

    public function testAttach()
    {
        $tid = $this->transect->id;

        $secondProject = ProjectTest::create();
        $secondProject->save();
        $pid = $secondProject->id;
        // $secondProject->addUserId($this->admin->id, Role::adminId());

        $this->doTestApiRoute('POST', '/api/v1/projects/'.$pid.'/transects/'.$tid);

        // api key authentication
        $this->callToken('POST', '/api/v1/projects/'.$pid.'/transects/'.$tid, $this->admin);
        $this->assertResponseStatus(401);

        $secondProject->addUserId($this->admin->id, Role::adminId());
        Cache::flush();

        // session cookie authentication
        $this->be($this->admin);
        $this->assertEmpty($secondProject->fresh()->transects);
        $this->call('POST', '/api/v1/projects/'.$pid.'/transects/'.$tid, ['_token' => Session::token()]);
        $this->assertResponseOk();
        $this->assertNotEmpty($secondProject->fresh()->transects);
    }

    public function testDestroy()
    {
        $id = $this->transect->id;
        $image = ImageTest::create();
        $image->transect()->associate($this->transect);
        $image->save();
        $image->getThumb();

        $this->doTestApiRoute('DELETE', '/api/v1/projects/1/transects/'.$id);

        // api key authentication
        $this->callToken('DELETE', '/api/v1/projects/1/transects/'.$id, $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('DELETE', '/api/v1/projects/1/transects/'.$id, $this->guest);
        $this->assertResponseStatus(401);

        $this->callToken('DELETE', '/api/v1/projects/1/transects/'.$id, $this->editor);
        $this->assertResponseStatus(401);

        $this->callToken('DELETE', '/api/v1/projects/1/transects/'.$id, $this->admin);
        // trying to delete withour force
        $this->assertResponseStatus(400);

        // session cookie authentication
        $this->be($this->admin);
        $this->call('DELETE', '/api/v1/projects/1/transects/'.$id, [
            '_token' => Session::token(),
            'force' => 'abc',
        ]);
        // deleting with force succeeds
        $this->assertResponseOk();
        $this->assertNull($this->transect->fresh());

        $this->assertTrue(File::exists($image->thumbPath));
        $this->assertNotNull($image->fresh());
        // call cleanup command immediately
        Artisan::call('remove-deleted-images');
        $this->assertNull($image->fresh());
        $this->assertFalse(File::exists($image->thumbPath));
    }
}
