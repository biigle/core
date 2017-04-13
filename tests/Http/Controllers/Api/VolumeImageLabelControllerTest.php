<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

class VolumeImageLabelControllerTest extends ApiTestCase
{
    public function testFindLabel()
    {
        $tid = $this->volume()->id;

        $label1 = LabelTest::create(['name' => 'my-label']);
        $image = ImageTest::create(['volume_id' => $tid]);
        ImageLabelTest::create([
            'label_id' => $label1->id,
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create(['name' => 'other-label']);
        ImageLabelTest::create([
            'label_id' => $label2->id,
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/image-labels/find/my");

        $this->beUser();
        $this->get("/api/v1/volumes/{$tid}/image-labels/find/my");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$tid}/image-labels/find/my")
            // other-label should not appear
            ->seeJsonEquals([[
                'id' => $label1->id,
                'name' => $label1->name,
                'color' => $label1->color,
                'parent_id' => $label1->parent_id,
            ]]);
        $this->assertResponseOk();

        $this->get("/api/v1/volumes/{$tid}/image-labels/find/label")
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
    }
}
