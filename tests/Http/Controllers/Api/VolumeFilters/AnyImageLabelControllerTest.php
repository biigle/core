<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api\VolumeFilters;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

class AnyImageLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        ImageLabelTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/filter/labels");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/images/filter/labels")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }
}
