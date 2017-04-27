<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;

class VolumeImageFilenameControllerTest extends ApiTestCase
{
        public function testIndex()
    {
        $vid = $this->volume()->id;

        $image = ImageTest::create([
            'volume_id' => $vid,
            'filename' => 'abcde.jpg',
        ]);
        $image2 = ImageTest::create([
            'volume_id' => $vid,
            'filename' => 'bcdef.jpg',
        ]);
        $image3 = ImageTest::create([
            'volume_id' => $vid,
            'filename' => '12345.jpg',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/images/filter/filename/a*");

        $this->beUser();
        $this->get("/api/v1/volumes/{$vid}/images/filter/filename/a*");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/xyz.jpg")
            ->seeJsonEquals([]);
        $this->assertResponseOk();

        $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/abcde.jpg")
            ->seeJsonEquals([$image->id]);
        $this->assertResponseOk();

        $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/a*")
            ->seeJsonEquals([$image->id]);
        $this->assertResponseOk();

        $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/*cde*")
            ->seeJsonEquals([$image->id, $image2->id]);
        $this->assertResponseOk();

        $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/*.jpg")
            ->seeJsonEquals([$image->id, $image2->id, $image3->id]);
        $this->assertResponseOk();

        $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/***.jpg")
            ->seeJsonEquals([$image->id, $image2->id, $image3->id]);
        $this->assertResponseOk();
    }
}
