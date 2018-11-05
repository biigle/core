<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Cache;
use ApiTestCase;
use Biigle\Shape;
use Carbon\Carbon;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class ImageAnnotationControllerTest extends ApiTestCase
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
        $annotation = AnnotationTest::create([
            'image_id' => $this->image->id,
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

        $this->doTestApiRoute('GET', "/api/v1/images/{$this->image->id}/annotations");

        $this->beUser();
        $response = $this->get("/api/v1/images/{$this->image->id}/annotations");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/images/{$this->image->id}/annotations")
            ->assertJsonFragment(['points' => [10, 20, 30, 40]])
            ->assertJsonFragment(['color' => 'bada55'])
            ->assertJsonFragment(['name' => 'My label']);
        $response->assertStatus(200);
    }

    public function testIndexAnnotationSessionHideOwn()
    {
        $session = AnnotationSessionTest::create([
            'volume_id' => $this->volume()->id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

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
        $response = $this->get("/api/v1/images/{$this->image->id}/annotations")
            ->assertJsonFragment(['points' => [10, 20]])
            ->assertJsonFragment(['points' => [20, 30]]);
        $response->assertStatus(200);

        $session->users()->attach($this->editor());
        Cache::flush();

        $response = $this->get("/api/v1/images/{$this->image->id}/annotations")
            ->assertJsonMissing(['points' => [10, 20]])
            ->assertJsonFragment(['points' => [20, 30]]);
        $response->assertStatus(200);
    }

    public function testStore()
    {
        $label = LabelTest::create();

        $this->doTestApiRoute('POST', "/api/v1/images/{$this->image->id}/annotations");

        $this->beGuest();
        $response = $this->post("/api/v1/images/{$this->image->id}/annotations");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations");
        // missing arguments
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => 99999,
            'points' => '',
        ]);
        // shape does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::lineId(),
            'label_id' => 99999,
        ]);
        // label is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
        ]);
        // confidence required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 2,
        ]);
        // confidence must be between 0 and 1
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => -1,
        ]);
        // confidence must be between 0 and 1
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => '[]',
        ]);
        // at least one point required
        $response->assertStatus(422);

        $response = $this->post("/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => '[10, 11]',
        ]);
        // label does not belong to a label tree of the project of the image
        $response->assertStatus(403);

        $this->project()->labelTrees()->attach($label->label_tree_id);
        // policies are cached
        Cache::flush();

        $response = $this->post("/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => '[10, 11]',
        ]);

        $response->assertStatus(200);

        $response->assertJsonFragment(['points' => [10, 11]]);
        $response->assertJsonFragment(['name' => $label->name]);
        $response->assertJsonFragment(['color' => $label->color]);

        $annotation = $this->image->annotations->first();
        $this->assertNotNull($annotation);
        $this->assertEquals(2, sizeof($annotation->points));
        $this->assertEquals(1, $annotation->labels()->count());
    }

    public function testStoreValidatePoints()
    {
        $this->beEditor();
        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.5,
            'points' => '[10, 11, 12, 13]',
        ]);
        // invalid number of points
        $response->assertStatus(422);
    }
}
