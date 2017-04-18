<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;

class ProjectsAnnotationsControllerTest extends ApiTestCase
{
    public function testFilter()
    {
        $id = $this->project()->id;

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $a3 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = AnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = AnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other volume should not appear
        AnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->json('GET', "/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}", ['take' => 'abc']);
        // take must be integer
        $this->assertResponseStatus(422);

        if ($this->isSqlite()) {
            $expect1 = ["{$a1->id}", "{$a2->id}"];
            $expect2 = ["{$a3->id}"];
            $expect3 = ["{$a1->id}"];
        } else {
            $expect1 = [$a1->id, $a2->id];
            $expect2 = [$a3->id];
            $expect3 = [$a1->id];
        }

        $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect1);

        $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l3->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect2);

        $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}?take=1");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect3);
    }
}
