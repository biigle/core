<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;

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

    public function testStoreLabelTreeNotAvailableForOtherImage()
    {
        // The editor can annotate the image of this project but the label tree of the
        // label is not attached to the project.
        $project = ProjectTest::create();
        $project->addUserId($this->editor()->id, Role::editorId());
        $image = ImageTest::create();
        $project->addVolumeId($image->volume_id);

        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
                [
                    'image_id' => $image->id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(403);

        $this->assertSame(1, $this->annotation->image->annotations()->count());
        $this->assertSame(0, $image->annotations()->count());
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
            ->assertStatus(422)
            ->assertJsonValidationErrors('label_id');

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

    public function testStoreDenyWholeFrameShape()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::wholeFrameId(),
                    // Points that would be valid for any other shape, so the request can
                    // only fail because of the shape.
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('0.shape_id');

        $this->assertSame(1, $this->annotation->image->annotations()->count());
    }

    public function testStoreInvalidPoints()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    // Invalid number of points for shape point.
                    'points' => [100, 100, 200, 200],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('0.points');

        $this->assertSame(1, $this->annotation->image->annotations()->count());
    }

    public function testStoreNoArrayItem()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', ['abc'])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                '0.image_id',
                '0.label_id',
                '0.confidence',
                '0.shape_id',
                '0.points',
            ]);

        $this->assertSame(1, $this->annotation->image->annotations()->count());
    }

    public function testStoreGuidelineRequired()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);

        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('0.guideline_id');

        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                    'guideline_id' => $guideline->id,
                ],
            ])
            ->assertStatus(200);

        $this->assertSame(2, $this->annotation->image->annotations()->count());
    }

    public function testStoreGuidelineNotExists()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                    'guideline_id' => -1,
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('0.guideline_id');
    }

    public function testStoreGuidelineLabel()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                    'guideline_id' => $guideline->id,
                ],
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelChild()->id,
                    'confidence' => 1.0,
                    'guideline_id' => $guideline->id,
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('1.label_id')
            ->assertJsonMissingValidationErrors('0.label_id');

        $this->assertSame(1, $this->annotation->image->annotations()->count());
    }

    public function testStoreGuidelineShape()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
            'only_shapes' => [Shape::circleId()],
        ]);

        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                    'guideline_id' => $guideline->id,
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('0.shape_id');

        $this
            ->postJson('api/v1/image-annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::circleId(),
                    'points' => [100, 100, 10],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                    'guideline_id' => $guideline->id,
                ],
            ])
            ->assertStatus(200);
    }

    public function testStoreGuidelinePerVolume()
    {
        AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);

        // The image belongs to a volume of another project without guideline.
        $image = ImageTest::create();
        $project = ProjectTest::create();
        $project->addVolumeId($image->volume_id);
        $project->addUserId($this->editor()->id, Role::editorId());
        $project->labelTrees()->attach($this->labelTree()->id);

        $this->beEditor();
        $this
            ->postJson('api/v1/image-annotations', [
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
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('1.guideline_id')
            ->assertJsonMissingValidationErrors('0.guideline_id');
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
}
