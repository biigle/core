<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;

class LargoControllerTest extends ApiTestCase
{
    public function testSaveChangedAlreadyExists()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);
        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelChild()->id,
        ]);

        $this->beEditor();
        $response = $this->post("/api/v1/volumes/{$id}/largo", [
            'dismissed' => [
                $l1->label_id => [$a1->id],
            ],
            'changed' => [
                $a1->id => $l2->label_id, // but this already exists from the same user!
            ],
        ]);
        $response->assertStatus(200);

        $this->assertEquals(1, $a1->labels()->count());
        $this->assertEquals($l2->id, $a1->labels()->first()->id);
    }

    public function testAnnotationMeanwhileDeleted()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $request = [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
            ],
            'changed' => [
                $a1->id => $this->labelChild()->id,
                $a2->id => $this->labelChild()->id,
            ],
        ];

        // annotation was deleted during the Largo session but saving should still work
        $a2->delete();

        $this->beEditor();
        $response = $this->post("/api/v1/volumes/{$id}/largo", $request);
        $response->assertStatus(200);
        $this->assertEquals($this->labelChild()->id, $a1->labels()->first()->label_id);
    }

    public function testLabelMeanwhileDeleted()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $otherLabel = LabelTest::create(['label_tree_id' => $this->labelRoot()->label_tree_id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $request = [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
            ],
            'changed' => [
                $a1->id => $otherLabel->id,
                $a2->id => $this->labelChild()->id,
            ],
        ];

        $otherLabel->delete();

        $this->beEditor();
        $this->post("/api/v1/volumes/{$id}/largo", $request)->assertStatus(200);
        $this->assertEquals($this->labelRoot()->id, $a1->labels()->first()->label_id);
        $this->assertEquals($this->labelChild()->id, $a2->labels()->first()->label_id);
    }
}
