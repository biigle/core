<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Modules\Export\Volume;

class ExportAreaControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $volume = Volume::convert($this->volume());
        $volume->exportArea = [10, 20, 30, 40];
        $volume->save();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$volume->id}/export-area");

        $this->beUser();
        $this->get("/api/v1/volumes/{$volume->id}/export-area");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$volume->id}/export-area");
        $this->assertResponseOk();
        $this->seeJsonEquals([10, 20, 30, 40]);
    }

    public function testStore()
    {
        $volume = Volume::convert($this->volume());

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$volume->id}/export-area");

        $this->beEditor();
        $this->post("/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20, 30, 40],
        ]);
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('POST', "/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20],
        ]);
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20, 30, '40'],
        ]);
        $this->assertResponseStatus(422);

        $this->post("/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20, 30, 40],
        ]);
        $this->assertResponseOk();
        $this->assertEquals([10, 20, 30, 40], $volume->fresh()->exportArea);
    }

    public function testDestroy()
    {
        $volume = Volume::convert($this->volume());
        $volume->exportArea = [10, 20, 30, 40];
        $volume->save();

        $this->doTestApiRoute('DELETE', "/api/v1/volumes/{$volume->id}/export-area");

        $this->beEditor();
        $this->delete("/api/v1/volumes/{$volume->id}/export-area");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->assertNotNull($volume->fresh()->exportArea);
        $this->delete("/api/v1/volumes/{$volume->id}/export-area");
        $this->assertResponseOk();
        $this->assertNull($volume->fresh()->exportArea);
    }
}
