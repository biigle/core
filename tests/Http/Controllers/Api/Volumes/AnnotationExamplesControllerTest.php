<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class AnnotationExamplesControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $tree = $this->labelTree();

        $parentLabel = LabelTest::create([
            'name' => 'my parent label',
            'label_tree_id' => $tree->id,
            'parent_id' => null,
        ]);
        $siblingLabel = LabelTest::create([
            'name' => 'my sibling label',
            'label_tree_id' => $tree->id,
            'parent_id' => $parentLabel->id,
        ]);
        $otherLabel = LabelTest::create([
            'name' => 'my other label',
            'label_tree_id' => $tree->id,
            'parent_id' => $parentLabel->id,
        ]);
        $separateLabel = LabelTest::create([
            'name' => 'my label',
            'label_tree_id' => $tree->id,
            'parent_id' => null,
        ]);
        $label = LabelTest::create([
            'name' => 'my label',
            'label_tree_id' => $tree->id,
            'parent_id' => $parentLabel->id,
        ]);

        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);

        $al0 = AnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $annotation->id,
        ]);
        $al1 = AnnotationLabelTest::create([
            'label_id' => $parentLabel->id,
            'annotation_id' => $annotation->id,
        ]);
        $al2 = AnnotationLabelTest::create([
            'label_id' => $siblingLabel->id,
            'annotation_id' => $annotation->id,
        ]);
        $al3 = AnnotationLabelTest::create([
            'label_id' => $separateLabel->id,
            'annotation_id' => $annotation->id,
        ]);
        // annotation from other volume should not appear
        AnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations/examples/{$label->id}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/annotations/examples/{$label->id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$id}/annotations/examples/{$label->id}", ['take' => 'abc']);
        // take must be integer
        $response->assertStatus(422);

        $response = $this->json('GET', "/api/v1/volumes/{$id}/annotations/examples/{$label->id}");
        $response->assertStatus(200);

        $response->assertExactJson([
            'label' => $label->toArray(),
            'annotations' => [$annotation->id],
        ]);

        $al0->delete();

        $response = $this->json('GET', "/api/v1/volumes/{$id}/annotations/examples/{$label->id}");
        $response->assertStatus(200);

        $response->assertExactJson([
            'label' => $parentLabel->toArray(),
            'annotations' => [$annotation->id],
        ]);
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

        $response = $this->get("/api/v1/volumes/{$id}/annotations/examples/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertJsonFragment(['annotations' => [$a2->id, $a3->id]]);

        // test hide other
        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $response = $this->get("/api/v1/volumes/{$id}/annotations/examples/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertJsonFragment(['annotations' => [$a1->id, $a2->id]]);

        // test hide both
        $session->hide_own_annotations = true;
        $session->save();

        $response = $this->get("/api/v1/volumes/{$id}/annotations/examples/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertJsonFragment(['annotations' => [$a2->id]]);

        $session->users()->detach($this->editor());

        $response = $this->get("/api/v1/volumes/{$id}/annotations/examples/{$l1->label_id}");
        $response->assertStatus(200);
        $response->assertJsonFragment(['annotations' => [$a1->id, $a2->id, $a3->id]]);
    }

    public function testIndexOtherTree()
    {
        $label = LabelTest::create();
        $otherLabel = LabelTest::create();

        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);

        $al = AnnotationLabelTest::create([
            'label_id' => $otherLabel->id,
            'annotation_id' => $annotation->id,
        ]);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$id}/annotations/examples/{$label->id}");
        $response->assertStatus(200);
        $response->assertExactJson([]);
    }
}
