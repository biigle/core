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
        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->json('GET', "/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}", ['take' => 'abc']);
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

        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect1);

        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l3->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect2);

        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}?take=1");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect3);
    }

    public function testFilterAnnotationSession()
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

        $expect = [$a2->id, $a3->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect);

        // test hide other
        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $expect = [$a1->id, $a2->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect);

        // test hide both
        $session->hide_own_annotations = true;
        $session->save();

        $expect = [$a2->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect);

        $session->users()->detach($this->editor());

        $expect = [$a1->id, $a2->id, $a3->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->get("/api/v1/volumes/{$id}/annotations/filter/label/{$l1->label_id}");
        $this->assertResponseOk();
        $this->seeJsonEquals($expect);
    }
}
