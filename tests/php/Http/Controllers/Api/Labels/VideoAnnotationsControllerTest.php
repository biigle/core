<?php

namespace Biigle\Tests\Http\Controllers\Api\Labels;

use ApiTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;

class VideoAnnotationsControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $video = VideoTest::create(['volume_id' => $this->volume()->id]);
        $label = LabelTest::create();
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        VideoAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a1->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);
        VideoAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a2->id]);
        $a3 = VideoAnnotationTest::create(['video_id' => $video->id]);
        VideoAnnotationLabelTest::create(['annotation_id' => $a3->id]);

        $this->doTestApiRoute('GET', "/api/v1/labels/{$label->id}/video-annotations");

        $this->beUser();
        $this->get("/api/v1/labels/{$label->id}/video-annotations")
            ->assertStatus(200)
            ->assertExactJson([]);

        $this->beGuest();
        $this->get("/api/v1/labels/{$label->id}/video-annotations")
            ->assertStatus(200)
            ->assertExactJson([
                $a2->id => $video->uuid,
                $a1->id => $video->uuid
            ]);

        // Show the newest annotation first.
        $this->get("/api/v1/labels/{$label->id}/video-annotations?take=1")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid]);

        $this->beGlobalAdmin();
        $this->get("/api/v1/labels/{$label->id}/video-annotations?take=1")
            ->assertStatus(200);
    }

    public function testIndexDuplicates()
    {
        $video = VideoTest::create(['volume_id' => $this->volume()->id]);
        $label = LabelTest::create();
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        VideoAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a1->id]);
        VideoAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a1->id]);

        $this->beGuest();
        $this->get("/api/v1/labels/{$label->id}/video-annotations")
            ->assertExactJson([$a1->id => $video->uuid]);
    }
}
