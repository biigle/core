<?php

namespace Biigle\Tests;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoAnnotationLabelFeatureVector;
use Illuminate\Database\QueryException;
use TestCase;

class VideoAnnotationLabelFeatureVectorTest extends TestCase
{
    public function testAttributes()
    {
        $v = VideoAnnotationLabelFeatureVector::factory()->create();
        $this->assertNotNull($v->id);
        $this->assertNotNull($v->annotation_id);
        $this->assertNotNull($v->label_id);
        $this->assertNotNull($v->label_tree_id);
        $this->assertNotNull($v->volume_id);
        $this->assertNotNull($v->vector);
    }

    public function testDeleteAnnotationLabelCascade()
    {
        $v = VideoAnnotationLabelFeatureVector::factory()->create();
        VideoAnnotationLabel::where('id', $v->id)->delete();
        $this->assertNull($v->fresh());
    }

    public function testDeleteAnnotationCascade()
    {
        $v = VideoAnnotationLabelFeatureVector::factory()->create();
        VideoAnnotation::where('id', $v->annotation_id)->delete();
        $this->assertNull($v->fresh());
    }

    public function testDeleteLabelRestrict()
    {
        $v = VideoAnnotationLabelFeatureVector::factory()->create();
        $this->expectException(QueryException::class);
        Label::where('id', $v->label_id)->delete();
    }

    public function testDeleteLabelTreeRestrict()
    {
        $v = VideoAnnotationLabelFeatureVector::factory()->create();
        $this->expectException(QueryException::class);
        LabelTree::where('id', $v->label_tree_id)->delete();
    }

    public function testDeleteVolumeCascade()
    {
        $a = VideoAnnotation::factory()->create();
        $v = VideoAnnotationLabelFeatureVector::factory()->create([
            'annotation_id' => $a->id,
        ]);
        $a->video->volume->delete();
        $this->assertNull($v->fresh());
    }
}
