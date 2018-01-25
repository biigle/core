<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Cache;
use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class ProjectImageAnnotationControllerTest extends ApiTestCase
{
    private $image;

    public function setUp()
    {
        parent::setUp();
        $this->image = ImageTest::create([
            'volume_id' => $this->volume()->id,
        ]);
    }

    public function testIndex()
    {
        $pid = $this->project()->id;
        $iid = $this->image->id;

        // The annotation should be shown no matter what project it belongs to.
        $annotation = AnnotationTest::create([
            'image_id' => $iid,
            'points' => [10, 20, 30, 40],
        ]);

        $label = LabelTest::create([
            'name' => 'My label',
            'color' => 'bada55',
        ]);

        AnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/projects/{$pid}/images/{$iid}/annotations");

        $this->beUser();
        $this->get("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertJsonFragment(['points' => [10, 20, 30, 40]])
            ->assertJsonFragment(['color' => 'bada55'])
            ->assertJsonFragment(['name' => 'My label'])
            ->assertStatus(200);
    }

    public function testIndexAccessThroughProject()
    {
        $pid = $this->project()->id;
        $iid = $this->image->id;

        $otherProject = ProjectTest::create();
        $otherProject->volumes()->attach($this->image->volume_id);

        $this->be($otherProject->creator);
        $this->get("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertStatus(403);

        $this->get("/api/v1/projects/{$otherProject->id}/images/{$iid}/annotations")
            ->assertStatus(200);
    }

    public function testIndexAnnotationSessionHideOwn()
    {
        $pid = $this->project()->id;
        $iid = $this->image->id;

        $a1 = AnnotationTest::create([
            'image_id' => $this->image->id,
            'created_at' => Carbon::yesterday(),
            'points' => [10, 20],
        ]);

        $al1 = AnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = AnnotationTest::create([
            'image_id' => $this->image->id,
            'created_at' => Carbon::today(),
            'points' => [20, 30],
        ]);

        $al2 = AnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $a2->id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertJsonFragment(['points' => [10, 20]])
            ->assertJsonFragment(['points' => [20, 30]])
            ->assertStatus(200);

        $session = AnnotationSessionTest::create([
            'project_id' => $pid,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);
        Cache::flush();

        $this->get("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertJsonMissing(['points' => [10, 20]])
            ->assertJsonFragment(['points' => [20, 30]])
            ->assertStatus(200);
    }

    public function testIndexAnnotationSessionHideOther()
    {
        $pid = $this->project()->id;
        $iid = $this->image->id;

        $a1 = AnnotationTest::create([
            'image_id' => $this->image->id,
            'created_at' => Carbon::yesterday(),
            'points' => [10, 20],
            'project_volume_id' => $this->projectVolume()->id,
        ]);

        $al1 = AnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = AnnotationTest::create([
            'image_id' => $this->image->id,
            'created_at' => Carbon::yesterday(),
            'points' => [20, 30],
            'project_volume_id' => $this->projectVolume()->id,
        ]);

        $al2 = AnnotationLabelTest::create([
            'user_id' => $this->admin()->id,
            'annotation_id' => $a2->id,
        ]);

        $a3 = AnnotationTest::create([
            'image_id' => $this->image->id,
            'created_at' => Carbon::yesterday(),
            'points' => [30, 40],
        ]);

        $al3 = AnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $a3->id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertJsonFragment(['points' => [10, 20]])
            ->assertJsonFragment(['points' => [20, 30]])
            ->assertJsonFragment(['points' => [30, 40]])
            ->assertStatus(200);

        $session = AnnotationSessionTest::create([
            'project_id' => $pid,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);
        Cache::flush();

        $this->get("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertJsonFragment(['points' => [10, 20]])
            ->assertJsonMissing(['points' => [20, 30]])
            ->assertJsonMissing(['points' => [30, 40]])
            ->assertStatus(200);
    }

    public function testStore()
    {
        $label = LabelTest::create();
        $pid = $this->project()->id;
        $iid = $this->image->id;

        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations");

        $this->beGuest();
        $this->post("/api/v1/projects/{$pid}/images/{$iid}/annotations")
            ->assertStatus(403);

        $this->beEditor();
        $this->json('POST', "/api/v1/projects/9999/images/{$iid}/annotations")
            // project does not exist
            ->assertStatus(404);

        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations")
            // missing arguments
            ->assertStatus(422);

        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => 99999,
                'points' => '[0,0]',
            ])
            // shape does not exist
            ->assertStatus(422);

        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$lineId,
                'label_id' => 99999,
            ])
            // label does not exist
            ->assertStatus(422);

        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$pointId,
                'label_id' => $label->id,
                'points' => '[0,0]',
            ])
            // confidence required
            ->assertStatus(422);

        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$pointId,
                'label_id' => $label->id,
                'confidence' => 2,
            ])
            // confidence must be between 0 and 1
            ->assertStatus(422);

        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$pointId,
                'label_id' => $label->id,
                'confidence' => -1,
            ])
            // confidence must be between 0 and 1
            ->assertStatus(422);

        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$pointId,
                'label_id' => $label->id,
                'confidence' => 0.5,
                'points' => '[]',
            ])
            // at least one point required
            ->assertStatus(422);

        $this->post("/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$pointId,
                'label_id' => $label->id,
                'confidence' => 0.5,
                'points' => '[10, 11]',
            ])
            // label does not belong to a label tree of the project of the image
            ->assertStatus(403);

        $this->project()->labelTrees()->attach($label->label_tree_id);
        // policies are cached
        Cache::flush();

        $this->post("/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$pointId,
                'label_id' => $label->id,
                'confidence' => 0.5,
                'points' => '[10, 11]',
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['points' => [10, 11]])
            ->assertJsonFragment(['name' => $label->name])
            ->assertJsonFragment(['color' => $label->color]);

        $annotation = $this->image->annotations->first();
        $this->assertNotNull($annotation);
        $this->assertEquals($this->projectVolume()->id, $annotation->project_volume_id);
        $this->assertEquals(2, sizeof($annotation->points));
        $this->assertEquals(1, $annotation->labels()->count());
    }

    public function testStoreValidatePoints()
    {
        $pid = $this->project()->id;
        $iid = $this->image->id;

        $this->beEditor();
        $this->json('POST', "/api/v1/projects/{$pid}/images/{$iid}/annotations", [
                'shape_id' => \Biigle\Shape::$pointId,
                'label_id' => $this->labelRoot()->id,
                'confidence' => 0.5,
                'points' => '[10, 11, 12, 13]',
            ])
            // invalid number of points
            ->assertStatus(422);
    }
}
