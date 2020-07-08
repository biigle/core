<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

class ImageLabelsControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $imageLabel = ImageLabelTest::create(['image_id' => $image->id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/labels");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$id}/images/labels")
            ->assertStatus(200)
            ->assertExactJson([
                $image->id => [$imageLabel->load('user', 'label')->toArray()],
            ]);
    }
}
