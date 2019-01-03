<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api\VolumeFilters;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

class ImageLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $vid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $vid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);

        $lid = $label->label_id;

        // This image shouldn't appear because it has the wrong label.
        $image2 = ImageTest::create(['volume_id' => $vid, 'filename' => 'b.jpg']);
        $label2 = ImageLabelTest::create([
            'image_id' => $image2->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/images/filter/image-label/{$lid}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$vid}/images/filter/image-label/{$lid}");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$vid}/images/filter/image-label/{$lid}")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }
}
