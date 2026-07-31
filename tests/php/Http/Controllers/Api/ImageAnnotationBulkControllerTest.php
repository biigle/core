<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;

class ImageAnnotationBulkControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp(): void
    {
        parent::setUp();
        $this->annotation = ImageAnnotationTest::create();
        $this->project()->volumes()->attach($this->annotation->image->volume_id);
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
        $this->doTestApiRoute('POST', $url);

        $image = ImageTest::create();
        $this->beUser();
        $this
            ->postJson($url, [[
                'image_id' => $image->id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->postJson($url, [[
                'image_id' => $image->id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(403);

        $this
            ->postJson($url, [
                [
                    'image_id' => $image->id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ]
            ])
            ->assertStatus(403);

        $this
            ->postJson($url, [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ]
            ])
            ->assertStatus(200);

        $this->assertSame(3, $this->annotation->image->annotations()->count());
        $annotation = $this->annotation->image->annotations()->orderBy('id', 'desc')->first();
        $this->assertSame(Shape::pointId(), $annotation->shape_id);
        $this->assertSame([100, 100], $annotation->points);
        $this->assertSame(1, $annotation->labels()->count());
        $this->assertSame($this->labelRoot()->id, $annotation->labels()->first()->label_id);
    }

    public function testStoreValidation()
    {
        $this->storeValidation('api/v1/image-annotations');
    }

    public function testStoreValidationLegacy()
    {
        $this->storeValidation('api/v1/annotations');
    }

    public function storeValidation($url)
    {
        $this->beEditor();
        $this
            ->postJson($url, [[
                'image_id' => 999,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => 999,
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => 999,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => LabelTest::create()->id,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(403);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 999,
            ]])
            ->assertStatus(422);

        $this->assertSame(1, $this->annotation->image->annotations()->count());

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id + 0.9,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 999,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id + 0.9,
                'confidence' => 999,
            ]])
            ->assertStatus(422);
    }

    public function testStoreLimit()
    {
        $this->storeLimit('api/v1/image-annotations');
    }

    public function testStoreLimitLegacy()
    {
        $this->storeLimit('api/v1/annotations');
    }

    public function storeLimit($url)
    {
        $data = [];
        for ($i=0; $i < 101; $i++) {
            $data[] = [
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ];
        }

        $this->beEditor();
        $this->postJson($url, $data)
            ->assertStatus(422);
    }

    public function testStoreLabelIdIsString()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => strval($this->labelRoot()->id),
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(200);

        $this->assertSame(2, $this->annotation->image->annotations()->count());
    }

    public function testStoreLabelIdIsFloat()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => 1.5,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(422);
    }

    public function storeWithAnnotationGuideline($url)
    {

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $image = ImageTest::create();
        $this->project()->addVolumeId($image->volume_id);

        $this->project()->labelTrees()->attach($label->label_tree_id);
        $this->project()->labelTrees()->attach($label2->label_tree_id);

        $lineId = Shape::lineId();
        $pointId = Shape::pointId();

        $annotationGuideline = AnnotationGuideline::create([
            'project_id' => $this->project()->id,
        ]);

        $requestData = [[
            'image_id' => $image->id,
            'shape_id' => $pointId,
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => [10, 11],
        ],
            [
                'image_id' => $image->id,
                'shape_id' => $pointId,
                'label_id' => $label->id,
                'confidence' => 0.5,
                'points' => [100, 101],
            ]];

        $requestDataAnnotationGuideline = [[
            'image_id' => $image->id,
            'shape_id' => $pointId,
            'label_id' => $label->id,
            'confidence' => 0.5,
            'points' => [10, 11],
            'annotation_guideline_id' => $annotationGuideline->id,
        ],
            [
                'image_id' => $image->id,
                'shape_id' => $pointId,
                'label_id' => $label->id,
                'confidence' => 0.5,
                'points' => [100, 101],
                'annotation_guideline_id' => $annotationGuideline->id,
            ]];

        $this->beEditor();

        // Base case with guideline
        $response = $this->postJson($url, $requestData);
        $response->assertSuccessful();

        // No enforcement
        $response = $this->postJson($url, $requestDataAnnotationGuideline);
        $response->assertSuccessful();

        // Enforcement - No shapes
        $annotationGuideline->update(['enforced' => true]);
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $response = $this->post($url, $requestDataAnnotationGuideline);
        $response->assertSuccessful();

        // Enforcement - one shape - wrong shape
        $annotationGuideline->update(['only_shapes' => [$lineId]]);
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $response = $this->post($url, $requestDataAnnotationGuideline);
        $response->assertStatus(422);

        // Enforcement - one shape - correct shape
        $annotationGuideline->update(['only_shapes' => [$pointId]]);
        $response = $this->post($url, $requestDataAnnotationGuideline);
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

        $response = $this->post($url, $requestDataAnnotationGuideline);
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

        $response = $this->post($url, $requestDataAnnotationGuideline);
        $response->assertSuccessful();

        // Enforcement - with correct label - wrong shape
        $annotationGuidelineLabel->update(['shape_id' => $lineId]);
        $response = $this->post($url, $requestData);
        $response->assertSuccessful();

        $response = $this->post($url, $requestDataAnnotationGuideline);
        $response->assertStatus(422);

        // Enforcement - with correct label - correct shape
        $annotationGuidelineLabel->update(['shape_id' => $pointId]);
        $response = $this->post($url, $requestDataAnnotationGuideline);
        $response->assertSuccessful();
    }

    public function testStoreWithAnnotationGuideline()
    {
        $this->storeWithAnnotationGuideline('api/v1/image-annotations');
    }

    public function testStoreWithAnnotationGuidelineLegacy()
    {
        $this->storeWithAnnotationGuideline('api/v1/annotations');
    }
}
