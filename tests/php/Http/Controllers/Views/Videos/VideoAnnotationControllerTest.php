<?php

namespace Biigle\Tests\Http\Controllers\Views\Videos;

use ApiTestCase;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Carbon\Carbon;

class VideoAnnotationControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $annotation = VideoAnnotationTest::create();
        $this->project()->addVolumeId($annotation->video->volume_id);

        $this->beUser();
        $response = $this->json('GET', "video-annotations/{$annotation->id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("video-annotations/{$annotation->id}");
        $response->assertRedirect("videos/{$annotation->video_id}/annotations?annotation={$annotation->id}");
    }

    public function testShowAnnotationSession()
    {
        $annotation = VideoAnnotationTest::create([
            'created_at' => Carbon::yesterday(),
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);
        $this->project()->addVolumeId($annotation->video->volume_id);

        $annotation2 = VideoAnnotationTest::create([
            'video_id' => $annotation->video_id,
            'created_at' => Carbon::today(),
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation2->id,
            'user_id' => $this->admin()->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $annotation->video->volume_id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $session->users()->attach($this->admin());

        $this->beAdmin();
        $response = $this->get("video-annotations/{$annotation->id}");
        $response->assertStatus(403);

        $response = $this->get("video-annotations/{$annotation2->id}");
        $response->assertStatus(302);
    }
}
