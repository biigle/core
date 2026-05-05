<?php

namespace Biigle\Tests;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Shape;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
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

    protected function createPivot(array $attrs = []): AnnotationGuidelineLabel
    {
        $data = array_merge([
            'annotation_guideline_id' => $this->guideline->id,
            'label_id' => $this->label->id,
        ], $attrs);

        DB::table('annotation_guideline_label')->insert($data);

        return AnnotationGuidelineLabel::where([
            'annotation_guideline_id' => $data['annotation_guideline_id'],
            'label_id' => $data['label_id'],
        ])->firstOrFail();
    }

    public function testAttributes()
    {
        $pivot = $this->createPivot();
        $this->assertSame($this->guideline->id, $pivot->annotation_guideline_id);
        $this->assertSame($this->label->id, $pivot->label_id);
        $this->assertNull($pivot->shape_id);
        $this->assertNull($pivot->description);
        $this->assertNull($pivot->reference_image_path);
    }

    public function testUnique()
    {
        $this->createPivot();
        $this->expectException(QueryException::class);
        $this->createPivot();
    }

    public function testShape()
    {
        $shape = ShapeTest::create();
        $pivot = $this->createPivot(['shape_id' => $shape->id]);
        $this->assertSame($shape->id, $pivot->shape->id);
    }

    public function testShapeOnDeleteSetNull()
    {
        $shape = ShapeTest::create();
        $pivot = $this->createPivot(['shape_id' => $shape->id]);
        $this->assertNotNull($this->guideline->labels()->first()->pivot->shape_id);
        $shape->delete();
        $this->assertNull($this->guideline->labels()->first()->pivot->shape_id);
    }

    public function testGuidelineOnDeleteCascade()
    {
        $this->createPivot();
        $this->guideline->delete();
        $this->assertFalse(AnnotationGuidelineLabel::where([
            'annotation_guideline_id' => $this->guideline->id,
        ])->exists());
    }

    public function testLabelOnDeleteCascade()
    {
        $this->createPivot();
        $this->label->delete();
        $this->assertFalse(AnnotationGuidelineLabel::where([
            'label_id' => $this->label->id,
        ])->exists());
    }
}
