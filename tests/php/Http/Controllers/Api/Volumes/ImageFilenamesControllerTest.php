<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;

class ImageFilenamesControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image1 = ImageTest::create([
            'volume_id' => $id,
            'filename' => '1.jpg',
        ]);
        $image2 = ImageTest::create([
            'volume_id' => $id,
            'filename' => '2.jpg',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/filenames/");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/filenames/")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/filenames/")
            ->assertExactJson([
                $image1->id => '1.jpg',
                $image2->id => '2.jpg',
            ])
            ->assertStatus(200);
    }
}
