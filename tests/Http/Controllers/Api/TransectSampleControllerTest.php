<?php

namespace Dias\Tests\Modules\Projects\Http\Controllers\Api;

use ApiTestCase;
use Dias\Tests\ImageTest;

class TransectSampleControllerTest extends ApiTestCase
{
    public function testIndex() {
        $id = $this->transect()->id;
        $i1 = ImageTest::create([
            'transect_id' => $id,
            'filename' => 'file1',
            'uuid' => 'uuid1',
        ]);
        $i2 = ImageTest::create([
            'transect_id' => $id,
            'filename' => 'file2',
            'uuid' => 'uuid2',
        ]);
        $i3 = ImageTest::create([
            'transect_id' => $id,
            'filename' => 'file3',
            'uuid' => 'uuid3',
        ]);
        $i4 = ImageTest::create([
            'transect_id' => $id,
            'filename' => 'file4',
            'uuid' => 'uuid4',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/sample");
        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/sample/3");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/sample");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/sample");
        $this->assertResponseOk();
        $this->seeJsonEquals(['uuid1', 'uuid2', 'uuid3', 'uuid4']);

        $this->get("/api/v1/transects/{$id}/sample/1");
        $this->assertResponseOk();
        $this->seeJsonEquals(['uuid1']);

        $this->get("/api/v1/transects/{$id}/sample/2");
        $this->assertResponseOk();
        $this->seeJsonEquals(['uuid1', 'uuid3']);
    }
}
