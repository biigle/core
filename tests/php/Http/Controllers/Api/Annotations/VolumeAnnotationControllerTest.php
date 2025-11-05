<?php

namespace Biigle\Tests\Http\Controllers\Api\Annotations;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Illuminate\Testing\Fluent\AssertableJson;

class VolumeAnnotationControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [1, 2],
        ]);
        $label = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);

        // Don't list annotations of other volumes.
        ImageAnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/annotations")->assertStatus(403);

        $this->beGuest();
        $response = $this->getJson("/api/v1/volumes/{$id}/annotations/")
            ->assertJson(
                fn (AssertableJson $json) =>
                $json->where('0.id', $annotation->id)
                    ->where('0.points', [1, 2])
                    ->where('0.labels.0.id', $label->id)
                    ->missing('1')
                    ->etc()
            );
    }

    public function testIndexVideo()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create(['volume_id' => $id]);
        $annotation = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[1, 2]],
            'frames' => [3],
        ]);
        $label = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);

        // Don't list annotations of other volumes.
        VideoAnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/annotations")->assertStatus(403);

        $this->beGuest();
        $response = $this->getJson("/api/v1/volumes/{$id}/annotations/")
            ->assertJson(
                fn (AssertableJson $json) =>
                $json->where('0.id', $annotation->id)
                    ->where('0.points', [[1, 2]])
                    ->where('0.frames', [3])
                    ->where('0.labels.0.id', $label->id)
                    ->missing('1')
                    ->etc()
            );
    }
}
