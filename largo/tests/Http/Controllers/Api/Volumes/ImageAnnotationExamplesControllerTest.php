<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Carbon\Carbon;

class ImageAnnotationExamplesControllerTest extends ApiTestCase
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
        $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);

        $al0 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $annotation->id,
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'label_id' => $parentLabel->id,
            'annotation_id' => $annotation->id,
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $siblingLabel->id,
            'annotation_id' => $annotation->id,
        ]);
        $al3 = ImageAnnotationLabelTest::create([
            'label_id' => $separateLabel->id,
            'annotation_id' => $annotation->id,
        ]);
        // annotation from other volume should not appear
        ImageAnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/image-annotations/examples/{$label->id}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/image-annotations/examples/{$label->id}")
            ->assertStatus(403);

        $this->beGuest();
        // take must be integer
        $this->json('GET', "/api/v1/volumes/{$id}/image-annotations/examples/{$label->id}", ['take' => 'abc'])
            ->assertStatus(422);

        $this->json('GET', "/api/v1/volumes/{$id}/image-annotations/examples/{$label->id}")
            ->assertStatus(200)
            ->assertExactJson([
                'label' => $label->toArray(),
                'annotations' => [$annotation->id => $image->uuid],
            ]);

        $al0->delete();

        $this->json('GET', "/api/v1/volumes/{$id}/image-annotations/examples/{$label->id}")
            ->assertStatus(200)
            ->assertExactJson([
                'label' => $parentLabel->toArray(),
                'annotations' => [$annotation->id => $image->uuid],
            ]);
    }

    public function testIndexAnnotationSession()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::today(),
        ]);

        $a3 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);

        $l1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);

        $l2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->editor()->id,
        ]);

        $l3 = ImageAnnotationLabelTest::create([
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

        $this->get("/api/v1/volumes/{$id}/image-annotations/examples/{$l1->label_id}")
            ->assertStatus(200)
            ->assertJsonFragment(['annotations' => [
                $a2->id => $image->uuid,
                $a3->id => $image->uuid,
            ]]);

        // test hide other
        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $this->get("/api/v1/volumes/{$id}/image-annotations/examples/{$l1->label_id}")
            ->assertStatus(200)
            ->assertJsonFragment(['annotations' => [
                $a1->id => $image->uuid,
                $a2->id => $image->uuid,
            ]]);

        // test hide both
        $session->hide_own_annotations = true;
        $session->save();

        $this->get("/api/v1/volumes/{$id}/image-annotations/examples/{$l1->label_id}")
            ->assertStatus(200)
            ->assertJsonFragment(['annotations' => [$a2->id => $image->uuid]]);

        $session->users()->detach($this->editor());

        $this->get("/api/v1/volumes/{$id}/image-annotations/examples/{$l1->label_id}")
            ->assertStatus(200)
            ->assertJsonFragment(['annotations' => [
                $a1->id => $image->uuid,
                $a2->id => $image->uuid,
                $a3->id => $image->uuid,
            ]]);
    }

    public function testIndexOtherTree()
    {
        $label = LabelTest::create();
        $otherLabel = LabelTest::create();

        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $otherLabel->id,
            'annotation_id' => $annotation->id,
        ]);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$id}/image-annotations/examples/{$label->id}");
        $response->assertStatus(200);
        $response->assertExactJson([]);
    }
}
