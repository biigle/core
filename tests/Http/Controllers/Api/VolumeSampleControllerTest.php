<?php

namespace Biigle\Tests\Modules\Projects\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;

class VolumeSampleControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;
        $uuid1 = ImageTest::create(['volume_id' => $id, 'filename' => 'file1'])->uuid;
        $uuid2 = ImageTest::create(['volume_id' => $id, 'filename' => 'file2'])->uuid;
        $uuid3 = ImageTest::create(['volume_id' => $id, 'filename' => 'file3'])->uuid;
        $uuid4 = ImageTest::create(['volume_id' => $id, 'filename' => 'file4'])->uuid;

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/sample");
        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/sample/3");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/sample");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/sample");
        $response->assertStatus(200);
        $response->assertExactJson([$uuid1, $uuid2, $uuid3, $uuid4]);

        $response = $this->get("/api/v1/volumes/{$id}/sample/1");
        $response->assertStatus(200);
        $response->assertExactJson([$uuid1]);

        $response = $this->get("/api/v1/volumes/{$id}/sample/2");
        $response->assertStatus(200);
        $response->assertExactJson([$uuid1, $uuid3]);
    }
}
