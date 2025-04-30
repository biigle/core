<?php

namespace Biigle\Tests\Modules\Largo;

use Biigle\ImageAnnotationLabel;
use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Volume;
use Illuminate\Database\QueryException;
use TestCase;

class ImageAnnotationLabelFeatureVectorTest extends TestCase
{
    public function testAttributes()
    {
        $v = ImageAnnotationLabelFeatureVector::factory()->create();
        $this->assertNotNull($v->id);
        $this->assertNotNull($v->annotation_id);
        $this->assertNotNull($v->label_id);
        $this->assertNotNull($v->label_tree_id);
        $this->assertNotNull($v->volume_id);
        $this->assertNotNull($v->vector);
    }

    public function testDeleteAnnotationLabelCascade()
    {
        $v = ImageAnnotationLabelFeatureVector::factory()->create();
        ImageAnnotationLabel::where('id', $v->id)->delete();
        $this->assertNull($v->fresh());
    }

    public function testDeleteAnnotationCascade()
    {
        $v = ImageAnnotationLabelFeatureVector::factory()->create();
        ImageAnnotation::where('id', $v->annotation_id)->delete();
        $this->assertNull($v->fresh());
    }

    public function testDeleteLabelRestrict()
    {
        $v = ImageAnnotationLabelFeatureVector::factory()->create();
        $this->expectException(QueryException::class);
        Label::where('id', $v->label_id)->delete();
    }

    public function testDeleteLabelTreeRestrict()
    {
        $v = ImageAnnotationLabelFeatureVector::factory()->create();
        $this->expectException(QueryException::class);
        LabelTree::where('id', $v->label_tree_id)->delete();
    }

    public function testDeleteVolumeCascade()
    {
        $a = ImageAnnotation::factory()->create();
        $v = ImageAnnotationLabelFeatureVector::factory()->create([
            'annotation_id' => $a->id,
        ]);
        $a->image->volume->delete();
        $this->assertNull($v->fresh());
    }
}
