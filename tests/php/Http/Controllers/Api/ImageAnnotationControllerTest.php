<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Shape;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Cache;
use Carbon\Carbon;

class ImageAnnotationControllerTest extends ApiTestCase
{
    private $image;

    public function setUp(): void
    {
        parent::setUp();
        $this->image = ImageTest::create([
            'volume_id' => $this->volume()->id,
        ]);

        $this->annotation = ImageAnnotationTest::create([
            'image_id' => $this->image->id,
            'points' => [10, 20, 30, 40],
        ]);
    }

    public function testIndex()
    {
        $label = LabelTest::create([
            'name' => 'My label',
            'color' => 'bada55',
        ]);

        ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $this->annotation->id,
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

        $a1 = ImageAnnotationTest::create([
            'image_id' => $this->image->id,
            'created_at' => Carbon::yesterday(),
            'points' => [10, 20],
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $this->image->id,
            'created_at' => Carbon::today(),
            'points' => [20, 30],
        ]);

        $al2 = ImageAnnotationLabelTest::create([
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

    public function testShow()
    {
        $this->show('api/v1/image-annotations');
    }

    public function testShowLegacy()
    {
        $this->show('api/v1/annotations');
    }

    public function show($url)
    {
        $id = $this->annotation->id;
        $this->annotation->points = [10, 10, 20, 20];
        $this->annotation->save();
        $this->doTestApiRoute('GET', "{$url}/{$id}");

        $this->beEditor();
        $response = $this->get("{$url}/{$id}");
        $response->assertStatus(200);

        $this->beGuest();
        $response = $this->get("{$url}/{$id}");
        $response->assertStatus(200);

        $this->beUser();
        $response = $this->get("{$url}/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("{$url}/{$id}")
            ->assertJsonFragment(['points' => [10, 10, 20, 20]]);
        // the labels should be fetched separately
        $this->assertStringNotContainsString('labels', $response->getContent());
        // image and volume objects from projectIds() call shouldn't be
        // included in the output
        $this->assertStringNotContainsString('"image"', $response->getContent());
        $this->assertStringNotContainsString('volume', $response->getContent());
    }

    public function testShowAnnotationSession()
    {
        $this->showAnnotationSession('api/v1/image-annotations');
    }

    public function testShowAnnotationSessionLegacy()
    {
        $this->showAnnotationSession('api/v1/annotations');
    }

    public function showAnnotationSession($url)
    {
        $this->annotation->created_at = Carbon::yesterday();
        $this->annotation->save();

        $session = AnnotationSessionTest::create([
            'volume_id' => $this->annotation->image->volume_id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $this->beAdmin();
        $response = $this->get("{$url}/{$this->annotation->id}");
        $response->assertStatus(200);

        $session->users()->attach($this->admin());
        Cache::flush();

        $response = $this->get("{$url}/{$this->annotation->id}");
        $response->assertStatus(403);
    }

    public function testStore()
    {
        $this->annotation->delete();
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
            'points' => [],
        ]);
        // at least one point required
        $response->assertStatus(422);

        $response = $this->post("/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => [10, 11],
        ]);
        // label does not belong to a label tree of the project of the image
        $response->assertStatus(403);

        $this->project()->labelTrees()->attach($label->label_tree_id);
        // policies are cached
        Cache::flush();

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::rectangleId(),
            'label_id' => $label->id,
            'confidence' => 1,
            'points' => [844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44],
        ]);
        // shape is invalid
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::lineId(),
            'label_id' => $label->id,
            'confidence' => 1,
            'points' => [844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44],
        ]);
        // shape is invalid
        $response->assertStatus(422);

        $response = $this->post("/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => [10, 11],
        ]);

        $response->assertSuccessful();

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
            'points' => [10, 11, 12, 13],
        ]);
        // invalid number of points
        $response->assertStatus(422);
    }

    public function testStoreDenyWholeFrameShape()
    {
        $this->beEditor();
        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::wholeFrameId(),
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.5,
            'points' => [1],
        ])->assertStatus(422);
    }

    public function testUpdate()
    {
        $this->update('api/v1/image-annotations');
    }

    public function testUpdateLegacy()
    {
        $this->update('api/v1/annotations');
    }

    public function update($url)
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('PUT', "{$url}/{$id}");

        $this->beUser();
        $response = $this->put("{$url}/{$id}");
        $response->assertStatus(403);

        $this->annotation->points = [10, 10];
        $this->annotation->save();

        $this->beAdmin();
        $response = $this->put("{$url}/{$id}", ['points' => [10, 15, 100, 200]]);
        $response->assertStatus(200);

        $this->annotation = $this->annotation->fresh();

        $this->assertEquals(4, sizeof($this->annotation->points));
        $this->assertEquals(15, $this->annotation->points[1]);

        $response = $this->json('PUT', "{$url}/{$id}", ['points' => [20, 25]]);
        $response->assertStatus(200);

        $this->annotation = $this->annotation->fresh();

        $this->assertEquals(2, sizeof($this->annotation->points));
        $this->assertEquals(25, $this->annotation->points[1]);
    }

    public function testUpdateInvalidPoints()
    {
        $this->beAdmin();

        $this->annotation->points = [0, 1, 2, 3, 4, 5, 6, 7];
        $this->annotation->shape_id = Shape::rectangleId();
        $this->annotation->save();

        $response = $this->json('PUT', "api/v1/image-annotations/{$this->annotation->id}", ['points' => [844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44]]);
        $response->assertStatus(422);

        $this->annotation->points = [0, 1, 2, 3, 4, 5, 6, 7];
        $this->annotation->shape_id = Shape::lineId();
        $this->annotation->save();

        $response = $this->json('PUT', "api/v1/image-annotations/{$this->annotation->id}", ['points' => [844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44]]);
        $response->assertStatus(422);
    }

    public function testUpdateValidatePoints()
    {
        $this->updateValidatePoints('api/v1/image-annotations');
    }

    public function testUpdateValidatePointsLegacy()
    {
        $this->updateValidatePoints('api/v1/annotations');
    }

    public function updateValidatePoints($url)
    {
        $id = $this->annotation->id;
        $this->annotation->shape_id = Shape::pointId();
        $this->annotation->save();

        $this->beAdmin();
        $response = $this->json('PUT', "{$url}/{$id}", ['points' => [10, 15, 100, 200]]);
        // invalid number of points
        $response->assertStatus(422);

        // Points must be array.
        $this->json('PUT', "{$url}/{$id}")
            ->assertStatus(422);
    }

    public function testUpdateChangeShape()
    {
        $this->updateChangeShape('api/v1/image-annotations');
    }

    public function testUpdateChangeShapeLegacy()
    {
        $this->updateChangeShape('api/v1/annotations');
    }

    public function updateChangeShape($url)
    {
        $id = $this->annotation->id;
        $this->annotation->points = [100, 200];
        $this->annotation->shape_id = Shape::pointId();
        $this->annotation->save();

        $this->beEditor();
        // invalid points for a circle
        $this->putJson("{$url}/{$id}", ['shape_id' => Shape::circleId()])
            ->assertStatus(422);

        $this
            ->putJson("{$url}/{$id}", [
                'shape_id' => Shape::circleId(),
                'points' => [100, 200, 300],
            ])
            ->assertStatus(200);

        $this->annotation->refresh();
        $this->assertEquals(Shape::circleId(), $this->annotation->shape_id);
    }

    public function testDestroy()
    {
        $this->destroy('api/v1/image-annotations');
    }

    public function testDestroyLegacy()
    {
        $this->destroy('api/v1/annotations');
    }

    public function destroy($url)
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('DELETE', "{$url}/{$id}");

        $this->beUser();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(403);

        $this->assertNotNull($this->annotation->fresh());

        $this->beAdmin();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(200);

        $this->assertNull($this->annotation->fresh());

        $this->annotation = ImageAnnotationTest::create();
        $this->project()->volumes()->attach($this->annotation->image->volume);
        $id = $this->annotation->id;

        $this->beUser();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(200);

        // admin could delete but the annotation was already deleted
        $this->beAdmin();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(404);
    }
}
