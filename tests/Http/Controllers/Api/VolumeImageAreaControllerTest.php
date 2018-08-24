<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;

class VolumeImageAreaControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/area");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/images/area")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/images/area")
            ->assertStatus(200)
            ->assertExactJson([$image->id => -1]);

        $image->metadata = ['area' => 4.2];
        $image->save();

        $this->get("/api/v1/volumes/{$id}/images/area")
            ->assertExactJson([$image->id => 4.2]);

        $image->attrs = ['laserpoints' => ['area' => 4.3]];
        $image->save();

        $this->get("/api/v1/volumes/{$id}/images/area")
            ->assertExactJson([$image->id => 4.3]);
    }
}
