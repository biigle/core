<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Api;

use Cache;
use ApiTestCase;
use Biigle\Shape;
use Carbon\Carbon;
use Biigle\Tests\LabelTest;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Tests\Modules\Videos\VideoAnnotationTest;
use Biigle\Tests\Modules\Videos\VideoAnnotationLabelTest;

class VideoAnnotationControllerTest extends ApiTestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->video = VideoTest::create(['project_id' => $this->project()->id]);
    }

    public function testIndex()
    {
        $annotation = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 20]],
        ]);

        $label = LabelTest::create([
            'name' => 'My label',
            'color' => 'bada55',
        ]);

        VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'video_annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/videos/{$this->video->id}/annotations");

        $this->beUser();
        $this->getJson("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(403);

        $this->beGuest();
        $this->getJson("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0]])
            ->assertJsonFragment(['points' => [[10, 20]]])
            ->assertJsonFragment(['color' => 'bada55'])
            ->assertJsonFragment(['name' => 'My label']);
    }

    public function testStore()
    {
        $label = LabelTest::create();
        $this->doTestApiRoute('POST', "/api/v1/videos/{$this->video->id}/annotations");

        $this->beGuest();
        $this->post("/api/v1/videos/{$this->video->id}/annotations")->assertStatus(403);

        $this->beEditor();
        // missing arguments
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(422);

        // shape does not exist
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => 99999,
                'label_id' => $label->id,
                'points' => [],
                'frames' => [],
            ])
            ->assertStatus(422);

        // points is required
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::lineId(),
                'label_id' => $label->id,
                'frames' => [],
            ])
            ->assertStatus(422);

        // frames is required
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::lineId(),
                'label_id' => $label->id,
                'points' => [],
            ])
            ->assertStatus(422);

        // at least one point required
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [],
                'frames' => [],
            ])
            ->assertStatus(422);

        // number of points and frames does not match
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [[0, 0]],
                'frames' => [0.0, 1.0],
            ])
            ->assertStatus(422);

        // label does not belong to a label tree of the project of the video
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [[0, 0]],
                'frames' => [0.0],
            ])
            ->assertStatus(403);

        $this->project()->labelTrees()->attach($label->label_tree_id);
        // policies are cached
        Cache::flush();

        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [0.0]])
            ->assertJsonFragment(['points' => [[10, 11]]])
            ->assertJsonFragment(['name' => $label->name])
            ->assertJsonFragment(['color' => $label->color]);

        $annotation = $this->video->annotations()->first();
        $this->assertNotNull($annotation);
        $this->assertEquals([[10, 11]], $annotation->points);
        $this->assertEquals([0.0], $annotation->frames);
        $this->assertEquals(1, $annotation->labels()->count());
    }

    public function testStoreValidatePoints()
    {
        $this->beEditor();
        // invalid number of points
        $this->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11, 12, 13]],
                'frames' => [0.0]
            ])
            ->assertStatus(422);
    }
}
