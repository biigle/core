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
        $response = $this->get("/api/v1/volumes/{$volume->id}/export-area");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$volume->id}/export-area");
        $response->assertStatus(200);
        $response->assertExactJson([10, 20, 30, 40]);
    }

    public function testStore()
    {
        $volume = Volume::convert($this->volume());

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$volume->id}/export-area");

        $this->beEditor();
        $response = $this->post("/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20, 30, 40],
        ]);
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20],
        ]);
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20, 30, '40'],
        ]);
        $response->assertStatus(422);

        $response = $this->post("/api/v1/volumes/{$volume->id}/export-area", [
            'coordinates' => [10, 20, 30, 40],
        ]);
        $response->assertStatus(200);
        $this->assertEquals([10, 20, 30, 40], $volume->fresh()->exportArea);
    }

    public function testDestroy()
    {
        $volume = Volume::convert($this->volume());
        $volume->exportArea = [10, 20, 30, 40];
        $volume->save();

        $this->doTestApiRoute('DELETE', "/api/v1/volumes/{$volume->id}/export-area");

        $this->beEditor();
        $response = $this->delete("/api/v1/volumes/{$volume->id}/export-area");
        $response->assertStatus(403);

        $this->beAdmin();
        $this->assertNotNull($volume->fresh()->exportArea);
        $response = $this->delete("/api/v1/volumes/{$volume->id}/export-area");
        $response->assertStatus(200);
        $this->assertNull($volume->fresh()->exportArea);
    }
}
