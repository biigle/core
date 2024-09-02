<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Events\AnnotationLabelAttached;
use Biigle\MediaType;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Illuminate\Support\Facades\Event;

class VideoAnnotationLabelControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->video = VideoTest::create(['volume_id' => $id]);
    }

    public function testStore()
    {
        Event::fake();
        $annotation = VideoAnnotationTest::create(['video_id' => $this->video->id]);
        $id = $annotation->id;

        $this->doTestApiRoute('POST', "api/v1/video-annotations/{$id}/labels");

        $this->beUser();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => LabelTest::create()->id,
            ])
            // Label ID belong to the projects of the video.
            ->assertStatus(403);

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertSuccessful()
            ->assertJsonFragment(['label_id' => $this->labelRoot()->id]);

        $label = $annotation->labels()->first();
        $this->assertNotNull($label);
        $this->assertSame($this->labelRoot()->id, $label->label_id);
        $this->assertSame($this->editor()->id, $label->user_id);
        Event::assertDispatched(AnnotationLabelAttached::class);

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            // Label is already attached.
            ->assertStatus(422);
    }

    public function testDestroy()
    {
        $annotation = VideoAnnotationTest::create(['video_id' => $this->video->id]);
        $annotationLabel1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->expert()->id,
        ]);
        $annotationLabel2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $annotationLabel3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('DELETE', "api/v1/video-annotation-labels/{$annotationLabel1->id}");

        $this->beUser();
        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel1->id}")
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel1->id}")
            // Cannot detach label of other user.
            ->assertStatus(403);

        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel3->id}")
            ->assertStatus(200);
        $this->assertNull($annotationLabel3->fresh());

        $this->beExpert();
        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel2->id}")
            ->assertStatus(200);
        $this->assertNull($annotationLabel2->fresh());

        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel1->id}")
            // Cannot detach the last label.
            ->assertStatus(422);
    }
}
