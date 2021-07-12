<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Filters;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;


class SimilarityIndicesControllerTest extends ApiTestCase
{
    public function testSimilarityIndexImage()
    {
        $volumeId = $this->volume()->id;

        $image1 = ImageTest::create([
            'volume_id' => $volumeId,
            'similarityIndex' => 2,
            'filename' => 'test-image1.jpg',
        ]);
        $image2 = ImageTest::create([
            'volume_id' => $volumeId,
            'similarityIndex' => 1,
            'filename' => 'test-image2.jpg',
        ]);
        $image3 = ImageTest::create([
            'volume_id' => $volumeId,
            'similarityIndex' => 0,
            'filename' => 'test-image3.jpg',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$volumeId}/similarity-indices/");

        $this->beUser();
        $this->get("/api/v1/volumes/{$volumeId}/similarity-indices/")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$volumeId}/similarity-indices/")
            ->assertExactJson([
                $image1->id => 2,
                $image2->id => 1,
                $image3->id => 0,
            ])
            ->assertStatus(200);


    }

    public function testVideoMediaType()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video1 = VideoTest::create([
            'volume_id' => $id,
            'filename' => '1.mp4',
        ]);
        $video2 = VideoTest::create([
            'volume_id' => $id,
            'filename' => '2.mp4',
        ]);

        // what should the api return if media type ius video
        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/similarity-indices/")
            ->assertStatus(200);

    }
}
