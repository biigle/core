<?php

namespace Biigle\Tests;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Shape;
use Illuminate\Database\QueryException;
use ModelTestCase;
use Storage;

class AnnotationGuidelineTest extends ModelTestCase
{
    protected static $modelClass = AnnotationGuideline::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->project_id);
        $this->assertNull($this->model->description);
        $this->assertFalse($this->model->enforced);
        $this->assertNull($this->model->only_shapes);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testProjectRequired()
    {
        $this->expectException(QueryException::class);
        self::create(['project_id' => null]);
    }

    public function testProjectUnique()
    {
        $project = ProjectTest::create();
        self::create(['project_id' => $project->id]);
        $this->expectException(QueryException::class);
        self::create(['project_id' => $project->id]);
    }

    public function testProjectOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $guideline = self::create(['project_id' => $project->id]);
        $project->delete();
        $this->assertNull($guideline->fresh());
    }

    public function testProject()
    {
        $project = ProjectTest::create();
        $guideline = self::create(['project_id' => $project->id]);
        $this->assertSame($project->id, $guideline->project->id);
    }

    public function testLabels()
    {
        $label = LabelTest::create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->model->id,
            'label_id' => $label->id,
        ]);
        $this->assertSame($label->id, $this->model->labels()->first()->id);
    }

    public function testLabelsOnDeleteCascade()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        Storage::fake('annotation_storage');

        $label = LabelTest::create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->model->id,
            'label_id' => $label->id,
        ]);
        $this->model->delete();
        $this->assertFalse($this->model->labels()->exists());
        $this->assertNotNull($label->fresh());
    }

    public function testAllowsLabelNotEnforced()
    {
        $label = LabelTest::create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->model->id,
        ]);

        $this->assertTrue($this->model->allowsLabel($label->id));
    }

    public function testAllowsLabelWithoutGuidelineLabels()
    {
        $this->model->update(['enforced' => true]);
        $label = LabelTest::create();

        $this->assertTrue($this->model->allowsLabel($label->id));
    }

    public function testAllowsLabel()
    {
        $this->model->update(['enforced' => true]);
        $label = LabelTest::create();
        $otherLabel = LabelTest::create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->model->id,
            'label_id' => $label->id,
        ]);

        $this->assertTrue($this->model->allowsLabel($label->id));
        $this->assertFalse($this->model->allowsLabel($otherLabel->id));
    }

    public function testAllowsShapeNotEnforced()
    {
        $label = LabelTest::create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->model->id,
            'label_id' => $label->id,
            'shape_id' => Shape::pointId(),
        ]);

        $this->assertTrue($this->model->allowsShape(Shape::rectangleId(), $label->id));
    }

    public function testAllowsShapeWithoutRestrictions()
    {
        $this->model->update(['enforced' => true]);
        $label = LabelTest::create();

        $this->assertTrue($this->model->allowsShape(Shape::rectangleId()));
        $this->assertTrue($this->model->allowsShape(Shape::rectangleId(), $label->id));
    }

    public function testAllowsShapeOnlyShapes()
    {
        $this->model->update([
            'enforced' => true,
            'only_shapes' => [Shape::pointId(), Shape::circleId()],
        ]);
        $label = LabelTest::create();

        $this->assertTrue($this->model->allowsShape(Shape::pointId()));
        $this->assertTrue($this->model->allowsShape(Shape::circleId(), $label->id));
        $this->assertFalse($this->model->allowsShape(Shape::rectangleId()));
        $this->assertFalse($this->model->allowsShape(Shape::rectangleId(), $label->id));
    }

    public function testAllowsShapeLabelShape()
    {
        $this->model->update([
            'enforced' => true,
            'only_shapes' => [Shape::pointId(), Shape::circleId()],
        ]);
        $label = LabelTest::create();
        $labelWithoutShape = LabelTest::create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->model->id,
            'label_id' => $label->id,
            'shape_id' => Shape::pointId(),
        ]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->model->id,
            'label_id' => $labelWithoutShape->id,
        ]);

        $this->assertTrue($this->model->allowsShape(Shape::pointId(), $label->id));
        $this->assertFalse($this->model->allowsShape(Shape::circleId(), $label->id));
        $this->assertTrue($this->model->allowsShape(Shape::circleId(), $labelWithoutShape->id));
        $this->assertFalse($this->model->allowsShape(Shape::rectangleId(), $labelWithoutShape->id));
    }
}
