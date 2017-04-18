<?php

namespace Biigle\Tests\Modules\Projects\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;

class VolumeSampleControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;
        $i1 = ImageTest::create([
            'volume_id' => $id,
            'filename' => 'file1',
            'uuid' => 'uuid1',
        ]);
        $i2 = ImageTest::create([
            'volume_id' => $id,
            'filename' => 'file2',
            'uuid' => 'uuid2',
        ]);
        $i3 = ImageTest::create([
            'volume_id' => $id,
            'filename' => 'file3',
            'uuid' => 'uuid3',
        ]);
        $i4 = ImageTest::create([
            'volume_id' => $id,
            'filename' => 'file4',
            'uuid' => 'uuid4',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/sample");
        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/sample/3");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/sample");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/sample");
        $this->assertResponseOk();
        $this->seeJsonEquals(['uuid1', 'uuid2', 'uuid3', 'uuid4']);

        $this->get("/api/v1/volumes/{$id}/sample/1");
        $this->assertResponseOk();
        $this->seeJsonEquals(['uuid1']);

        $this->get("/api/v1/volumes/{$id}/sample/2");
        $this->assertResponseOk();
        $this->seeJsonEquals(['uuid1', 'uuid3']);
    }
}
