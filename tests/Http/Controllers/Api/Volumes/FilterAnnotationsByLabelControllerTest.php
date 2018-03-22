<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class FilterAnnotationsByLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $a3 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = AnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = AnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other volume should not appear
        AnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}", ['take' => 'abc']);
        // take must be integer
        $response->assertStatus(422);

        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a2->id, $a1->id]);

        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l3->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a3->id]);

        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}?take=1");
        $response->assertStatus(200);
        $response->assertExactJson([$a2->id]);
    }

    public function testIndexAnnotationSession()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);

        $a1 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);

        $a2 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::today(),
        ]);

        $a3 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);

        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->editor()->id,
        ]);

        $l3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->admin()->id,
        ]);

        $this->beEditor();

        // test hide own
        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $session->users()->attach($this->editor());

        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a2->id, $a3->id]);

        // test hide other
        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a1->id, $a2->id]);

        // test hide both
        $session->hide_own_annotations = true;
        $session->save();

        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a2->id]);

        $session->users()->detach($this->editor());

        $response = $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertExactJson([$a1->id, $a2->id, $a3->id]);
    }

    public function testIndexDuplicate()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);

        $a1 = AnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);

        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->admin()->id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a1->id]);
    }
}
