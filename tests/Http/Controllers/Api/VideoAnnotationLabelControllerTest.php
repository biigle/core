<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Tests\Modules\Videos\VideoAnnotationTest;
use Biigle\Tests\Modules\Videos\VideoAnnotationLabelTest;

class VideoAnnotationLabelControllerTest extends ApiTestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->video = VideoTest::create(['project_id' => $this->project()->id]);
    }

    public function testStore()
    {
        $annotation = VideoAnnotationTest::create(['video_id' => $this->video->id]);
        $id = $annotation->id;

        $this->doTestApiRoute('POST', "api/v1/video-annotations/{$id}/labels");

        $this->beUser();
        $this->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(403);

        $this->beEditor();
        $this->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => LabelTest::create()->id,
            ])
            // Label ID belong to the projects of the video.
            ->assertStatus(403);

        $this->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['label_id' => $this->labelRoot()->id]);

        $label = $annotation->labels()->first();
        $this->assertNotNull($label);
        $this->assertEquals($this->labelRoot()->id, $label->label_id);
        $this->assertEquals($this->editor()->id, $label->user_id);
    }

    public function testDestroy()
    {
        $this->markTestIncomplete();
    }
}
