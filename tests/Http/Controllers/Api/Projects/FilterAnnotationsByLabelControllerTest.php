<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;

class FilterAnnotationsByLabelControllerTest extends ApiTestCase
{
    public function testIndex()
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
        $response = $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}", ['take' => 'abc']);
        // take must be integer
        $response->assertStatus(422);

        $response = $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a1->id, $a2->id]);

        $response = $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l3->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a3->id]);

        $response = $this->get("/api/v1/projects/{$id}/annotations/filter/label/{$l1->label_id}?take=1");
        $response->assertStatus(200);
        $response->assertExactJson([$a1->id]);
    }
}
