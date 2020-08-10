<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;

class FileLabelsControllerTest extends ApiTestCase
{
    public function testIndexImages()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $imageLabel = ImageLabelTest::create(['image_id' => $image->id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/files/labels");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/files/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$id}/files/labels")
            ->assertStatus(200)
            ->assertExactJson([
                $image->id => [$imageLabel->load('user', 'label')->toArray()],
            ]);
    }

    public function testIndexVideos()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $video = VideoTest::create(['volume_id' => $id]);
        $videoLabel = VideoLabelTest::create(['video_id' => $video->id]);

        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$id}/files/labels")
            ->assertStatus(200)
            ->assertExactJson([
                $video->id => [$videoLabel->load('user', 'label')->toArray()],
            ]);
    }
}
