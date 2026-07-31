<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Events\AnnotationLabelAttached;
use Biigle\Shape;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\LabelTest;
use Cache;
use Carbon\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Session;

class ImageAnnotationLabelControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp(): void
    {
        parent::setUp();
        $this->annotation = ImageAnnotationTest::create();
        $this->project()->volumes()->attach($this->annotation->image->volume);
    }

    public function testIndex()
    {
        $this->index('api/v1/image-annotations');
    }

    public function testIndexLegacy()
    {
        $this->index('api/v1/annotations');
    }

    public function index($url)
    {
        $user = $this->editor();
        $label = $this->labelRoot();
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $user->id,
        ]);
        $id = $this->annotation->id;
        $this->doTestApiRoute('GET', "{$url}/{$id}/labels");

        // api key authentication
        $this->beUser();
        $response = $this->get("{$url}/{$id}/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("{$url}/{$id}/labels");
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $al->id,
            'confidence' => $al->confidence,
            'user' => [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
            ],
            'label' => [
                'id' => $label->id,
                'name' => $label->name,
                'color' => $label->color,
                'parent_id' => $label->parent_id,
                'label_tree_id' => $label->label_tree_id,
            ],
        ]);
    }

    public function testIndexAnnotationSession()
    {
        $this->indexAnnotationSession('api/v1/image-annotations');
    }

    public function testIndexAnnotationSessionLegacy()
    {
        $this->indexAnnotationSession('api/v1/annotations');
    }

    public function indexAnnotationSession($url)
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
        $response = $this->get("{$url}/{$this->annotation->id}/labels");
        $response->assertStatus(200);

        $session->users()->attach($this->admin());
        Cache::flush();

        $response = $this->get("{$url}/{$this->annotation->id}/labels");
        $response->assertStatus(403);
    }

    public function testStore()
    {
        $this->store('api/v1/image-annotations');
    }

    public function testStoreLegacy()
    {
        $this->store('api/v1/annotations');
    }

    public function store($url)
    {
        Event::fake();
        $id = $this->annotation->id;
        $this->doTestApiRoute('POST', "{$url}/{$id}/labels");

        // Invalid arguments
        $this->beEditor();
        $response = $this->json('POST', "{$url}/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 10,
        ]);
        $response->assertStatus(422);

        $response = $this->json('POST', "{$url}/{$id}/labels", [
            'label_id' => -1,
            'confidence' => 1,
        ]);
        $response->assertStatus(422);

        $response = $this->json('POST', "{$url}/{$id}/labels", [
            'confidence' => 1,
        ]);
        $response->assertStatus(422);

        $this->assertSame(0, $this->annotation->labels()->count());

        $this->beUser();
        $response = $this->post("{$url}/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->post("{$url}/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->post("{$url}/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(201);
        $this->assertSame(1, $this->annotation->labels()->count());

        Event::assertDispatched(AnnotationLabelAttached::class);

        $this->beAdmin();
        $response = $this->json('POST', "{$url}/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(201);

        Event::assertDispatched(AnnotationLabelAttached::class);
        $this->assertSame(2, $this->annotation->labels()->count());
        $response->assertJsonFragment([
            'id' => $this->labelRoot()->id,
            'name' => $this->labelRoot()->name,
            'parent_id' => $this->labelRoot()->parent_id,
            'color' => $this->labelRoot()->color,
        ]);
        $response->assertJsonFragment([
            'id' => $this->admin()->id,
            'firstname' => $this->admin()->firstname,
            'lastname' => $this->admin()->lastname,
            'role_id' => $this->admin()->role_id,
        ]);
        $response->assertJsonFragment(['confidence' => 0.1]);

        $response = $this->post("{$url}/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        // the same user cannot attach the same label twice
        $response->assertStatus(400);
        $this->assertSame(2, $this->annotation->labels()->count());
    }

    public function testStoreLabelIdTypeString()
    {
        $this->beEditor();
        $id = $this->annotation->id;
        $response = $this->json('POST', "api/v1/image-annotations/{$id}/labels", [
            'label_id' => Str::random(2),
            'confidence' => 10,
        ]);
        $response->assertStatus(422);
    }

    public function testUpdate()
    {
        $this->update('api/v1/image-annotation-labels');
    }

    public function testUpdateLegacy()
    {
        $this->update('api/v1/annotation-labels');
    }

    public function update($url)
    {
        $annotationLabel = ImageAnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
            'confidence' => 0.5,
        ]);
        $id = $annotationLabel->id;

        $this->doTestApiRoute('PUT', "{$url}/{$id}");

        $this->beUser();
        $response = $this->put("{$url}/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->put("{$url}/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put("{$url}/{$id}");
        $response->assertStatus(200);

        $this->beAdmin();
        $response = $this->put("{$url}/{$id}");
        $response->assertStatus(200);

        $this->assertSame(0.5, $annotationLabel->fresh()->confidence);
        $this->beEditor();
        $response = $this->put("{$url}/{$id}", [
            '_token' => Session::token(),
            'confidence' => 0.1,
        ]);
        $response->assertStatus(200);
        $this->assertSame(0.1, $annotationLabel->fresh()->confidence);
    }

    //TODO: add test for label change
    public function testDestroy()
    {
        $this->destroy('api/v1/image-annotation-labels');
    }

    public function testDestroyLegacy()
    {
        $this->destroy('api/v1/annotation-labels');
    }

    public function destroy($url)
    {
        $id = ImageAnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = ImageAnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->admin()->id,
        ])->id;

        $this->doTestApiRoute('DELETE', "{$url}/{$id}");

        $this->beUser();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(403);

        $this->assertTrue($this->annotation->labels()->where('id', $id)->exists());
        $this->beEditor();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(200);
        $this->assertFalse($this->annotation->labels()->where('id', $id)->exists());

        $response = $this->delete("{$url}/{$id2}");
        // not the own label
        $response->assertStatus(403);

        $this->assertTrue($this->annotation->labels()->where('id', $id2)->exists());

        $id = ImageAnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;
        $this->assertTrue($this->annotation->labels()->where('id', $id)->exists());

        $this->beAdmin();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(200);
        $this->assertFalse($this->annotation->labels()->where('id', $id)->exists());

        $response = $this->delete("{$url}/{$id2}");
        $response->assertStatus(200);
        $this->assertFalse($this->annotation->labels()->exists());
    }

    public function testDestroyLast()
    {
        $this->destroyLast('api/v1/image-annotation-labels');
    }

    public function testDestroyLastLegacy()
    {
        $this->destroyLast('api/v1/annotation-labels');
    }

    public function destroyLast($url)
    {
        $id = ImageAnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = ImageAnnotationLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $this->beEditor();
        $response = $this->delete("{$url}/{$id}");
        $response->assertStatus(200);

        $this->assertNotNull($this->annotation->fresh());

        $response = $this->delete("{$url}/{$id2}");
        $response->assertStatus(200);
        $this->assertNull($this->annotation->fresh());
    }

    private function cleanupAnnotationLabels()
    {
        $this->annotation->labels()->delete();
    }

    public function storeWithGuideline($url)
    {
        Event::fake();
        $id = $this->annotation->id;
        $this->annotation->shape_id = Shape::pointId();
        $this->annotation->save();
        $annotationGuideline = AnnotationGuideline::create([
            'project_id' => $this->project()->id,
        ]);

        $requestData = [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ];

        $requestDataWithGuideline = [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
            'annotation_guideline_id' => $annotationGuideline->id,
        ];

        $this->doTestApiRoute('POST', "{$url}/{$id}/labels");

        $this->beEditor();
        $response = $this->post("{$url}/{$id}/labels", $requestData);
        $response->assertSuccessful();

        $this->cleanupAnnotationLabels();

        $response = $this->post("{$url}/{$id}/labels", $requestDataWithGuideline);
        $response->assertSuccessful();

        $this->cleanupAnnotationLabels();

        // Apply enforcement but no specification
        $annotationGuideline->update(['enforced' => true]);

        $response = $this->post("{$url}/{$id}/labels", $requestData);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();

        $response = $this->post("{$url}/{$id}/labels", $requestDataWithGuideline);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();

        // Wrong shape
        $annotationGuideline->update(['only_shapes' => [Shape::circleId()]]);

        $response = $this->post("{$url}/{$id}/labels", $requestData);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();

        $response = $this->post("{$url}/{$id}/labels", $requestDataWithGuideline);
        $response->assertStatus(422);

        // Fix shape
        $annotationGuideline->update(['only_shapes' => [Shape::circleId(), Shape::pointId()]]);

        $response = $this->post("{$url}/{$id}/labels", $requestData);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();

        // Add different label to guideline
        AnnotationGuidelineLabel::create([
            'annotation_guideline_id' => $annotationGuideline->id,
            'label_id' => LabelTest::create()->id,
            'uuid' => 'a556b10d-e46b-460b-b2b0-58ce1dd0c966',
            'shape_id' => null,
        ]);


        $response = $this->post("{$url}/{$id}/labels", $requestData);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();

        $response = $this->post("{$url}/{$id}/labels", $requestDataWithGuideline);
        $response->assertStatus(422);

        $annotationGuidelineLabel = AnnotationGuidelineLabel::create([
            'annotation_guideline_id' => $annotationGuideline->id,
            'label_id' => $this->labelRoot()->id,
            'uuid' => 'aa0d036f-2a5a-4015-bef3-0f815f1c4bb2',
            'shape_id' => null,
        ]);

        $response = $this->post("{$url}/{$id}/labels", $requestDataWithGuideline);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();

        // Set a different shape
        $annotationGuidelineLabel->update([
            'shape_id' => Shape::circleId(),
        ]);
        $response = $this->post("{$url}/{$id}/labels", $requestData);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();

        $response = $this->post("{$url}/{$id}/labels", $requestDataWithGuideline);
        $response->assertStatus(422);

        $annotationGuidelineLabel->update([
            'shape_id' => Shape::pointId(),
        ]);

        $response = $this->post("{$url}/{$id}/labels", $requestDataWithGuideline);
        $response->assertSuccessful();
        $this->cleanupAnnotationLabels();
    }

    public function testStoreWithGuideline()
    {
        $this->storeWithGuideline('api/v1/image-annotations');
    }

    public function testStoreWithGuidelineLegacy()
    {
        $this->storeWithGuideline('api/v1/annotations');
    }
}
