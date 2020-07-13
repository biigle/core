<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Sorters;

use ApiTestCase;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;

class ImageFilenameControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image1 = ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);
        $image2 = ImageTest::create(['volume_id' => $id, 'filename' => 'a.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/order-by/filename");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images/order-by/filename");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/images/order-by/filename")
            ->assertStatus(200);
        // ordering is crucial, so we can't simply use seeJsonEquals!
        $this->assertEquals("[{$image2->id},{$image1->id}]", $response->getContent());
    }
}
