<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;

class LargoControllerTest extends ApiTestCase
{
    public function testSaveProject()
    {
        $id = $this->project()->id;
        // make sure the label tree and label are set up
        $this->labelRoot();

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $a3 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);
        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->editor()->id,
        ]);
        $l3 = AnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other project should not be affected
        $a4 = AnnotationTest::create();
        $l4 = AnnotationLabelTest::create(['annotation_id' => $a4->id]);

        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/largo");

        $this->beUser();
        $response = $this->post("/api/v1/projects/{$id}/largo", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ],
        ]);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->post("/api/v1/projects/{$id}/largo", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ],
        ]);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$id}/largo", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
                $a4->id => $this->labelRoot()->id,
            ],
        ]);
        // a4 does not belong to the same project
        $response->assertStatus(400);

        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$id}/largo", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $l3->label_id,
                $a3->id => $this->labelRoot()->id,
            ],
        ]);
        // a label in 'changed' does not belong to a label tree available for the project
        $response->assertStatus(403);

        $this->expectsJobs(RemoveAnnotationPatches::class);
        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$id}/largo", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ],
        ]);
        $response->assertStatus(200);

        // a1 was dismissed and then changed, should have a new annotation label
        $this->assertNull($l1->fresh());
        $this->assertNotNull($a1->fresh());
        $this->assertEquals($this->labelRoot()->id, $a1->labels()->first()->label_id);

        // a2 was dismissed but not changed, should be deleted
        $this->assertNull($l2->fresh());
        $this->assertNull($a2->fresh());

        // a3 was dismissed and changed but the label does not belong to the user,
        // should get a new additional label
        $this->assertNotNull($l3->fresh());
        $this->assertNotNull($a3->fresh());
        $this->assertEquals(2, $a3->labels()->count());

        // should not be affected
        $this->assertNotNull($l4->fresh());
        $this->assertNotNull($a4->fresh());
    }
}
