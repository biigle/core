<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;

class VolumeLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $tid = $this->volume()->id;

        $label1 = LabelTest::create();
        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        AnnotationLabelTest::create([
            'label_id' => $label1->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create();
        AnnotationLabelTest::create([
            'label_id' => $label2->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/annotation-labels");

        $this->beUser();
        $this->get("/api/v1/volumes/{$tid}/annotation-labels");
        $this->assertResponseStatus(403);

        $this->beGuest();

        $this->get("/api/v1/volumes/{$tid}/annotation-labels/")
            ->seeJsonEquals([
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
        $this->assertResponseOk();
    }
}
