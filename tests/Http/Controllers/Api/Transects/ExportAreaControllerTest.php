<?php

namespace Dias\Tests\Modules\Export\Http\Controllers\Api\Transects;

use ApiTestCase;
use Dias\Modules\Export\Transect;

class ExportAreaControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $transect = Transect::convert($this->transect());
        $transect->exportArea = [10, 20, 30, 40];
        $transect->save();

        $this->doTestApiRoute('GET', "/api/v1/transects/{$transect->id}/export-area");

        $this->beUser();
        $this->get("/api/v1/transects/{$transect->id}/export-area");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$transect->id}/export-area");
        $this->assertResponseOk();
        $this->seeJsonEquals([10, 20, 30, 40]);
    }

    public function testStore()
    {
        $transect = Transect::convert($this->transect());

        $this->doTestApiRoute('POST', "/api/v1/transects/{$transect->id}/export-area");

        $this->beEditor();
        $this->post("/api/v1/transects/{$transect->id}/export-area", [
            'coordinates' => [10, 20, 30, 40],
        ]);
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('POST', "/api/v1/transects/{$transect->id}/export-area", [
            'coordinates' => [10, 20],
        ]);
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/transects/{$transect->id}/export-area", [
            'coordinates' => [10, 20, 30, '40'],
        ]);
        $this->assertResponseStatus(422);

        $this->post("/api/v1/transects/{$transect->id}/export-area", [
            'coordinates' => [10, 20, 30, 40],
        ]);
        $this->assertResponseOk();
        $this->assertEquals([10, 20, 30, 40], $transect->fresh()->exportArea);
    }

    public function testDestroy()
    {
        $transect = Transect::convert($this->transect());
        $transect->exportArea = [10, 20, 30, 40];
        $transect->save();

        $this->doTestApiRoute('DELETE', "/api/v1/transects/{$transect->id}/export-area");

        $this->beEditor();
        $this->delete("/api/v1/transects/{$transect->id}/export-area");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->assertNotNull($transect->fresh()->exportArea);
        $this->delete("/api/v1/transects/{$transect->id}/export-area");
        $this->assertResponseOk();
        $this->assertNull($transect->fresh()->exportArea);
    }
}
