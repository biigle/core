<?php

namespace Biigle\Tests\Http\Controllers\Api\Annotations;

use ApiTestCase;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;

class VolumeAnnotationLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $tid = $this->volume()->id;

        $label1 = LabelTest::create();
        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create([
            'label_id' => $label1->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create();
        ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/annotation-labels");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$tid}/annotation-labels");
        $response->assertStatus(403);

        $this->beGuest();

        $response = $this->get("/api/v1/volumes/{$tid}/annotation-labels/")
            ->assertExactJson([
                [
                    'id' => $label1->id,
                    'name' => $label1->name,
                    'color' => $label1->color,
                    'parent_id' => $label1->parent_id,
                ],
                [
                    'id' => $label2->id,
                    'name' => $label2->name,
                    'color' => $label2->color,
                    'parent_id' => $label2->parent_id,
                ],
            ]);
        $response->assertStatus(200);
    }
}
