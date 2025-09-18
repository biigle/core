<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ShapeTest;
use Biigle\Tests\UserTest;

class FilterImageAnnotationsByLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $a3 = ImageAnnotationTest::create(['image_id' => $image->id]);

        $l1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = ImageAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = ImageAnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other volume should not appear
        ImageAnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(403);

        $this->beGuest();
        // take must be integer
        $this->json('GET', "/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}", ['take' => 'abc'])
            ->assertStatus(422);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $image->uuid, $a1->id => $image->uuid]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l3->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a3->id => $image->uuid]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?take=1")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $image->uuid]);
    }

    public function testIndexDuplicate()
    {
        $id = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $l1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);

        $l2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->admin()->id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a1->id => $image->uuid]);
    }

    public function testFilters()
    {
        $id = $this->project()->id;

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $u1 = UserTest::create();
        $u2 = UserTest::create();

        $s1 = ShapeTest::create();
        $s2 = ShapeTest::create();

        $a1 = ImageAnnotationTest::create(['image_id' => $image->id, 'shape_id' =>$s1->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image->id, 'shape_id' =>$s1->id]);
        $a3 = ImageAnnotationTest::create(['image_id' => $image->id, 'shape_id' =>$s2->id]);

        $l1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id, 'user_id' =>$u1->id]);
        $l2 = ImageAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id, 'user_id' =>$u2->id]);
        $l3 = ImageAnnotationLabelTest::create(['annotation_id' => $a3->id, 'label_id' => $l1->label_id, 'user_id' =>$u2->id]);

        $this->beEditor();

        //Case 1: filter by shape
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?shape_id[]={$s1->id}")
            ->assertExactJson([$a1->id => $image->uuid, $a2->id => $image->uuid]);

        //Case 2: filter by user
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?user_id[]={$u2->id}")
            ->assertExactJson([$a2->id => $image->uuid, $a3->id => $image->uuid]);

        //Case 3: filter by shape and user
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?shape_id[]={$s2->id}&user_id[]={$u2->id}&union=0")
            ->assertExactJson([$a3->id => $image->uuid]);

        //Case 4: combine user and shape with negatives
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?shape_id[]=-{$s2->id}&user_id[]=-{$u2->id}&union=0")
            ->assertExactJson([$a1->id => $image->uuid]);

        //Case 5: combine (excluding values and not) with union
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]={$u2->id}&union=1")
            ->assertExactJson([$a1->id => $image->uuid, $a2->id => $image->uuid, $a3->id => $image->uuid]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?shape_id[]={$s1->id}&user_id[]={$u1->id}&union=1")
            ->assertExactJson([$a1->id => $image->uuid, $a2->id => $image->uuid]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?shape_id[]=-{$s1->id}&user_id[]={$u1->id}&union=1")
            ->assertExactJson([$a1->id => $image->uuid, $a3->id => $image->uuid]);

        //Case 6: combine incompatible filters: annotations should be of user1 and/or user2 at the same time
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]={$u2->id}&union=0")
            ->assertExactJson([]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]=-{$u1->id}&union=1")
            ->assertExactJson([$a1->id => $image->uuid, $a2->id => $image->uuid, $a3->id => $image->uuid]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]=-{$u1->id}&shape_id[]=1&union=1")
            ->assertExactJson([$a1->id => $image->uuid, $a2->id => $image->uuid, $a3->id => $image->uuid]);

        //Case 7: combine with a 'not' case
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]=-{$u2->id}&union=0")
            ->assertExactJson([$a1->id => $image->uuid]);
    }

    public function testIndexFilenameFilter()
    {
        $pid = $this->project()->id;
        $id = $this->volume()->id;

        $image1 = ImageTest::create(['volume_id' => $id, 'filename' => 'test_image_001.jpg']);
        $image2 = ImageTest::create(['volume_id' => $id, 'filename' => 'test_image_002.jpg']);
        $image3 = ImageTest::create(['volume_id' => $id, 'filename' => 'another_file.png']);

        $a1 = ImageAnnotationTest::create(['image_id' => $image1->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image2->id]);
        $a3 = ImageAnnotationTest::create(['image_id' => $image3->id]);

        $l1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = ImageAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = ImageAnnotationLabelTest::create(['annotation_id' => $a3->id, 'label_id' => $l1->label_id]);

        $this->beEditor();

        // Test filename pattern matching with wildcards
        $this->get("/api/v1/projects/{$pid}/image-annotations/filter/label/{$l1->label_id}?filename[]=test_image_*")
            ->assertExactJson([$a2->id => $image2->uuid, $a1->id => $image1->uuid]);

        // Test exact filename matching
        $this->get("/api/v1/projects/{$pid}/image-annotations/filter/label/{$l1->label_id}?filename[]=test_image_001.jpg")
            ->assertExactJson([$a1->id => $image1->uuid]);

        // Test filename extension matching
        $this->get("/api/v1/projects/{$pid}/image-annotations/filter/label/{$l1->label_id}?filename[]=*.jpg")
            ->assertExactJson([$a2->id => $image2->uuid, $a1->id => $image1->uuid]);

        // Test negative filename filtering
        $this->get("/api/v1/projects/{$pid}/image-annotations/filter/label/{$l1->label_id}?filename[]=-test_image_*")
            ->assertExactJson([$a3->id => $image3->uuid]);

        // Test union mode with filename patterns
        $this->get("/api/v1/projects/{$pid}/image-annotations/filter/label/{$l1->label_id}?filename[]=test_image_001.jpg&filename[]=another_file.png&union=1")
            ->assertExactJson([$a3->id => $image3->uuid, $a1->id => $image1->uuid]);
    }
}
