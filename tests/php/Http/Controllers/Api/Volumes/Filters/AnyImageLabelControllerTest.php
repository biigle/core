<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Filters;

use ApiTestCase;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;

class AnyImageLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->markTestIncomplete('implement support for videos in new controller?');
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
