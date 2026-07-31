<?php
namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Cache;
use Carbon\Carbon;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Response;

class ImageAnnotationControllerTest extends ApiTestCase
{
    private $image;
    private $annotation;
    private $label;

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

        $this->label = LabelTest::create();

        ImageAnnotationLabelTest::create([
            'label_id' => $this->label->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
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
        $response = $this->getJson("/api/v1/images/{$this->image->id}/annotations")->assertStatus(200);

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        $response = new TestResponse(
            new Response(
                $content,
                $response->baseResponse->getStatusCode(),
                $response->baseResponse->headers->all()
            )
        );

        $response->assertJsonFragment(['points' => [10, 20, 30, 40]])
            ->assertJsonFragment(['color' => 'bada55'])
            ->assertJsonFragment(['name' => 'My label']);
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
        $response = $this->getJson("/api/v1/images/{$this->image->id}/annotations")->assertStatus(200);

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        $response = new TestResponse(
            new Response(
                $content,
                $response->baseResponse->getStatusCode(),
                $response->baseResponse->headers->all()
            )
        );

        $response->assertJsonFragment(['points' => [10, 20]])
            ->assertJsonFragment(['points' => [20, 30]]);


        $session->users()->attach($this->editor());
        Cache::flush();

        $response = $this->getJson("/api/v1/images/{$this->image->id}/annotations")->assertStatus(200);

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        $response = new TestResponse(
            new Response(
                $content,
                $response->baseResponse->getStatusCode(),
                $response->baseResponse->headers->all()
            )
        );

        $response->assertJsonMissing(['points' => [10, 20]])
            ->assertJsonFragment(['points' => [20, 30]]);

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
        $this->assertSame(2, sizeof($annotation->points));
        $this->assertSame(1, $annotation->labels()->count());
    }

    public function testStoreWithAnnotationGuideline()
    {
        $this->annotation->delete();
        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $this->project()->labelTrees()->attach($label->label_tree_id);
        $this->project()->labelTrees()->attach($label2->label_tree_id);

        $lineId = Shape::lineId();
        $pointId = Shape::pointId();

        $annotationGuideline = AnnotationGuideline::create([
            'project_id' => $this->project()->id,
        ]);
        $url = "/api/v1/images/{$this->image->id}/annotations";
        $requestData = [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => [10, 11],
        ];

        $requestDataWithGuideline = [
            'shape_id' => Shape::pointId(),
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => [10, 11],
            'annotation_guideline_id' => $annotationGuideline->id,
        ];

        $this->doTestApiRoute('POST', "/api/v1/images/{$this->image->id}/annotations");

        $this->beEditor();

        // No enforcement
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $response = $this->post($url, $requestDataWithGuideline);
        $response->assertSuccessful();

        // Enforcement - No shapes
        $annotationGuideline->update(['enforced' => true]);
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $response = $this->post($url, $requestDataWithGuideline);
        $response->assertSuccessful();

        // Enforcement - one shape
        $annotationGuideline->update(['only_shapes' => [$lineId]]);
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $annotationGuideline->update(['only_shapes' => [$lineId]]);
        $response = $this->post($url, $requestDataWithGuideline);
        $response->assertStatus(422);

        // Enforcement - one shape - correct shape
        $annotationGuideline->update(['only_shapes' => [$pointId]]);
        $response = $this->post($url, $requestDataWithGuideline);
        $response->assertSuccessful();

        // Enforcement - with wrong label - no shape specified
        $annotationGuideline->update(['only_shapes' => [$lineId, $pointId]]);
        $annotationGuidelineLabel2 = AnnotationGuidelineLabel::create(
            [
                'label_id' => $label2->id,
                'annotation_guideline_id' => $annotationGuideline->id,
                'shape_id' => null,
                'uuid' => 'c796ccec-c746-308f-8009-9f1f68e2aa62',
            ]
        );

        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $annotationGuideline->update(['only_shapes' => [$lineId]]);
        $response = $this->post($url, $requestDataWithGuideline);
        $response->assertStatus(422);

        // Enforcement - with correct label - no shape specified
        $annotationGuidelineLabel = AnnotationGuidelineLabel::create(
            [
                'label_id' => $label->id,
                'annotation_guideline_id' => $annotationGuideline->id,
                'shape_id' => null,
                'uuid' => 'c796ccec-c748-308f-8009-9f1f68e2aa62',
            ]
        );

        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        // Enforcement - with correct label - wrong shape
        $annotationGuidelineLabel->update(['shape_id' => $lineId]);
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $response = $this->post($url, $requestDataWithGuideline);
        $response->assertStatus(422);

        // Enforcement - with correct label - correct shape
        $annotationGuidelineLabel->update(["shape_id" => $pointId]);
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

    }

    public function testStoreWithFeatureVectorWithoutHNSW()
    {
        $this->beEditor();

        // Test label
        $label = LabelTest::create();
        // Label must be attached to a label tree
        $this->project()->labelTrees()->attach($label->label_tree_id);
        // Save it in DB
        ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $this->volume()->id,
            'label_id' => $label->id,
            'label_tree_id' => $label->label_tree_id,
            'vector' => range(1, 384),
        ]);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'confidence' => 0.5,
            'points' => [10, 11],
        ]);
        // A label or a feature vector must be provided
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 10),
            'confidence' => 0.5,
            'points' => [10, 11],
        ]);
        // Invalid feature vector dimension
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 384),
            'confidence' => 0.5,
            'points' => [10, 11],
        ]);
        $response->assertSuccessful();

        // Since we saved just one label in DB we get it as the result
        // of the vector search
        $response->assertJsonFragment(['label_id' => $label->id]);

        // Save multiple labels in DB
        $differentLabel = LabelTest::create();
        $this->project()->labelTrees()->attach($differentLabel->label_tree_id);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $this->volume()->id,
            'label_id' => $differentLabel->id,
            'label_tree_id' => $differentLabel->label_tree_id,
            'vector' => range(384, 384 * 2 - 1),
        ]);

        $anotherDifferentLabel = LabelTest::create();
        $this->project()->labelTrees()->attach($anotherDifferentLabel->label_tree_id);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $this->volume()->id,
            'label_id' => $anotherDifferentLabel->id,
            'label_tree_id' => $anotherDifferentLabel->label_tree_id,
            'vector' => range(384 * 2, 384 * 3 - 1),
        ]);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 384),
            'confidence' => 0.5,
            'points' => [10, 11],
        ]);

        $response->assertSuccessful();
        // The feature vector of differentLabel is more similar to the input feature vector
        // than feature vector of anotherDifferentLabel, so it is ranked higher.
        $response->assertJson([
            'labelBOTLabels' => [
                ['id' => $differentLabel->id],
                ['id' => $anotherDifferentLabel->id],
            ]
        ]);

        // Now with an Annotation Guideline

        // No valid label with selected shape
        $annotationGuideline = AnnotationGuideline::create([
            'project_id' => $this->project()->id,
            'enforced' => true,
            'only_shapes' => [Shape::lineId()],
        ]);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 384),
            'confidence' => 0.5,
            'points' => [10, 11],
            'annotation_guideline_id' => $annotationGuideline->id,
        ]);
        $response->assertStatus(404);

        // no shape selected, should be successful
        $annotationGuideline->update(['only_shapes' => null]);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 384),
            'confidence' => 0.5,
            'points' => [10, 11],
            'annotation_guideline_id' => $annotationGuideline->id,
        ]);
        $response->assertSuccessful();

        // only two labels in the guideline
        $annotationGuideline->update(
            ['only_shapes' => [Shape::lineId(), Shape::pointId()]]
        );

        AnnotationGuidelineLabel::create(
            [
                'label_id' => $label->id,
                'annotation_guideline_id' => $annotationGuideline->id,
                'shape_id' => null,
                'uuid' => 'c796ccec-c748-308f-8009-9f1f68e2aa64',
            ]
        );
        AnnotationGuidelineLabel::create(
            [
                'label_id' => $differentLabel->id,
                'annotation_guideline_id' => $annotationGuideline->id,
                'shape_id' => null,
                'uuid' => 'c796ccec-c748-308f-8009-9f1f68e2aa62',
            ]
        );

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 384),
            'confidence' => 0.5,
            'points' => [10, 11],
            'annotation_guideline_id' => $annotationGuideline->id,
        ]);

        $response->assertSuccessful();
        $response->assertJson([
            'labelBOTLabels' => [
                ['id' => $differentLabel->id],
            ],
            'labels' => [
                ['label_id' => $label->id]
            ]
        ]);

        //Add another label, but with different shapes
        AnnotationGuidelineLabel::create(
            [
                'label_id' => $anotherDifferentLabel->id,
                'annotation_guideline_id' => $annotationGuideline->id,
                'shape_id' => Shape::lineId(),
                'uuid' => 'c123ccec-c748-308f-8009-9f1f68e2aa62',
            ]
        );

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 384),
            'confidence' => 0.5,
            'points' => [10, 11],
            'annotation_guideline_id' => $annotationGuideline->id,
        ]);
        $response->assertSuccessful();
        $response->assertJson([
            'labelBOTLabels' => [
                ['id' => $differentLabel->id],
            ],
            'labels' => [
                ['label_id' => $label->id]
            ]
        ]);
    }

    public function testStoreWithFeatureVectorIgnoreLabelTrees()
    {
        $this->beEditor();

        $label1 = LabelTest::create();
        $this->project()->labelTrees()->attach($label1->label_tree_id);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $this->volume()->id,
            'label_id' => $label1->id,
            'label_tree_id' => $label1->label_tree_id,
            'vector' => range(1, 384),
        ]);

        $label2 = LabelTest::create();
        $this->project()->labelTrees()->attach($label2->label_tree_id);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $this->volume()->id,
            'label_id' => $label2->id,
            'label_tree_id' => $label2->label_tree_id,
            'vector' => range(384, 384 * 2 - 1),
        ]);

        $label3 = LabelTest::create();
        $this->project()->labelTrees()->attach($label3->label_tree_id);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $this->volume()->id,
            'label_id' => $label3->id,
            'label_tree_id' => $label3->label_tree_id,
            'vector' => range(384, 384 * 2 - 1),
        ]);

        // Test handling of spaces before IDs, too.
        config(['labelbot.ignore_label_trees' => [' '.$label3->label_tree_id]]);

        $response = $this->json('POST', "/api/v1/images/{$this->image->id}/annotations", [
            'shape_id' => Shape::pointId(),
            'feature_vector' => range(1, 384),
            'confidence' => 0.5,
            'points' => [10, 11],
        ]);

        $response->assertSuccessful();
        $response->assertJsonPath('labelBOTLabels.0.id', $label2->id);
        $response->assertJsonMissingPath('labelBOTLabels.1');
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

        $this->assertSame(4, sizeof($this->annotation->points));
        $this->assertSame(15, $this->annotation->points[1]);

        $response = $this->json('PUT', "{$url}/{$id}", ['points' => [20, 25]]);
        $response->assertStatus(200);

        $this->annotation = $this->annotation->fresh();

        $this->assertSame(2, sizeof($this->annotation->points));
        $this->assertSame(25, $this->annotation->points[1]);
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
        $this->assertSame(Shape::circleId(), $this->annotation->shape_id);
    }

    private function resetAnnotation()
    {
        $id = $this->annotation->id;
        $this->annotation->points = [100, 200];
        $this->annotation->shape_id = Shape::pointId();
        $this->annotation->save();
        return $id;
    }

    public function updateChangeShapeWithAnnotationGuideline($url)
    {

        $id = $this->resetAnnotation();

        $label2 = LabelTest::create();
        $this->project()->labelTrees()->attach($this->label->label_tree_id);
        $this->project()->labelTrees()->attach($label2->label_tree_id);

        $annotationGuideline = AnnotationGuideline::create([
            'project_id' => $this->project()->id,
        ]);

        $this->beAdmin();
        $requestData = [
            'shape_id' => Shape::circleId(),
            'points' => [100, 200, 300],
        ];
        $requestDataWithGuideline = [
            'shape_id' => Shape::circleId(),
            'points' => [100, 200, 300],
            'annotation_guideline_id' => $annotationGuideline->id,
        ];

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(200);

        $this->resetAnnotation();

        // Add enforcement, but no elements
        $annotationGuideline->update(['enforced' => true]);

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(200);

        $this->resetAnnotation();

        // Allow only points
        $annotationGuideline->update(['only_shapes' => [Shape::pointId()]]);

        $this->putJson("{$url}/{$id}", $requestData)
            ->assertStatus(200);

        $this->resetAnnotation();

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(422);

        // Now also circles are allowed
        $annotationGuideline->update(['only_shapes' => [Shape::pointId(), Shape::circleId()]]);

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(200);

        $this->resetAnnotation();

        // Add a different label to the annotation guideline
        $annotationGuidelineLabel2 = AnnotationGuidelineLabel::create(
            [
                'label_id' => $label2->id,
                'annotation_guideline_id' => $annotationGuideline->id,
                'shape_id' => null,
                'uuid' => 'e43f4497-489a-4401-b49c-2fab48199bf7',
            ]
        );

        $this->putJson("{$url}/{$id}", $requestData)
            ->assertStatus(200);

        $this->resetAnnotation();

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(422);

        // Add the label to the guideline
        $annotationGuidelineLabel = AnnotationGuidelineLabel::create(
            [
                'label_id' => $this->label->id,
                'annotation_guideline_id' => $annotationGuideline->id,
                'shape_id' => null,
                'uuid' => 'a998dab7-ae83-49b9-b432-6f63cd55d4af',
            ]
        );

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(200);

        $this->resetAnnotation();

        // Add shape to the label in the guideline
        $annotationGuidelineLabel->update(['shape_id' => Shape::pointId()]);

        $this->putJson("{$url}/{$id}", $requestData)
            ->assertStatus(200);

        $this->resetAnnotation();

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(422);

        // Fix the shape
        $annotationGuidelineLabel->update(['shape_id' => Shape::circleId()]);

        $this->putJson("{$url}/{$id}", $requestDataWithGuideline)
            ->assertStatus(200);
    }

    public function testUpdateChangeShapeWithGuideline()
    {
        $this->updateChangeShapeWithAnnotationGuideline('api/v1/image-annotations');
    }

    public function testUpdateChangeShapeWithGuidelineLegacy()
    {
        $this->updateChangeShapeWithAnnotationGuideline('api/v1/annotations');
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
