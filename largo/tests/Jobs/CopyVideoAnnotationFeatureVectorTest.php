<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\Modules\Largo\Jobs\CopyVideoAnnotationFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotationLabel;
use TestCase;

class CopyVideoAnnotationFeatureVectorTest extends TestCase
{
    public function testHandle()
    {
        $vector = VideoAnnotationLabelFeatureVector::factory()->create();
        $annotationLabel = VideoAnnotationLabel::factory()->create([
            'annotation_id' => $vector->annotation_id,
        ]);

        (new CopyVideoAnnotationFeatureVector($annotationLabel))->handle();

        $vectors = VideoAnnotationLabelFeatureVector::where('annotation_id', $vector->annotation_id)
            ->orderBy('id', 'asc')->get();
        $this->assertCount(2, $vectors);
        $this->assertSame($annotationLabel->id, $vectors[1]->id);
        $this->assertSame($annotationLabel->annotation_id, $vectors[1]->annotation_id);
        $this->assertSame($annotationLabel->label_id, $vectors[1]->label_id);
        $this->assertSame($annotationLabel->label->label_tree_id, $vectors[1]->label_tree_id);
        $this->assertSame($vector->volume_id, $vectors[1]->volume_id);
        $this->assertEquals($vector->vector, $vectors[1]->vector);
    }
}
