<?php

namespace Biigle\Tests\Http\Controllers\Api\Labels;

use ApiTestCase;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Carbon\Carbon;

class VideoAnnotationsControllerTest extends ApiTestCase
{
    public function testIndexAnnotationSession()
    {
        $video = VideoTest::create(['volume_id' => $this->volume()->id]);
        $label = LabelTest::create();
        // Own annotation before the annotation session.
        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::yesterday(),
        ]);
        VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);
        // Own annotation of the annotation session.
        $a2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::today(),
        ]);
        VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $a2->id,
            'user_id' => $this->editor()->id,
        ]);
        // Annotation of another user.
        $a3 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::today(),
        ]);
        VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $a3->id,
            'user_id' => $this->admin()->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $this->volume()->id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);
        $session->users()->attach($this->editor());

        $this->beEditor();
        $this->get("/api/v1/labels/{$label->id}/video-annotations")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid]);

        // The annotation session does not apply to the admin.
        $this->beAdmin();
        $this->get("/api/v1/labels/{$label->id}/video-annotations")
            ->assertStatus(200)
            ->assertExactJson([
                $a3->id => $video->uuid,
                $a2->id => $video->uuid,
                $a1->id => $video->uuid,
            ]);
    }

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
