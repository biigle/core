<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api\VolumeSorters;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

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
