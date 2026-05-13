<?php

namespace Biigle\Tests;

use Biigle\AnnotationGuidelineLabel;
use Illuminate\Database\QueryException;
use Storage;
use TestCase;

class AnnotationGuidelineLabelTest extends TestCase
{
    protected $guideline;
    protected $label;

    public function setUp(): void
    {
        parent::setUp();
        $this->guideline = AnnotationGuidelineTest::create();
        $this->label = LabelTest::create();
    }

    public function testAttributes()
    {
        $pivot = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->guideline->id,
            'label_id' => $this->label->id,
        ]);
        $this->assertSame($this->guideline->id, $pivot->annotation_guideline_id);
        $this->assertSame($this->label->id, $pivot->label_id);
        $this->assertNull($pivot->shape_id);
        $this->assertNull($pivot->description);
        $this->assertNotNull($pivot->uuid);
    }

    public function testUnique()
    {
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->guideline->id,
            'label_id' => $this->label->id,
        ]);
        $this->expectException(QueryException::class);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->guideline->id,
            'label_id' => $this->label->id,
        ]);
    }

    public function testShapeOnDeleteSetNull()
    {
        $shape = ShapeTest::create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->guideline->id,
            'label_id' => $this->label->id,
            'shape_id' => $shape->id,
        ]);
        $this->assertNotNull($this->guideline->labels()->first()->pivot->shape_id);
        $shape->delete();
        $this->assertNull($this->guideline->labels()->first()->pivot->shape_id);
    }

    public function testGuidelineOnDeleteCascade()
    {
        config(['projects.annotation_guideline_storage_disk' => 'annotation_storage']);
        Storage::fake('annotation_storage');

        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->guideline->id,
            'label_id' => $this->label->id,
        ]);
        $this->guideline->delete();
        $this->assertFalse(
            AnnotationGuidelineLabel::where('annotation_guideline_id', $this->guideline->id)->exists()
        );
    }

    public function testLabelOnDeleteCascade()
    {
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $this->guideline->id,
            'label_id' => $this->label->id,
        ]);
        $this->label->delete();
        $this->assertFalse(
            AnnotationGuidelineLabel::where('label_id', $this->label->id)->exists()
        );
    }
}
