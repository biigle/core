<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;

class VolumeAnnotationLabelsTest extends ApiTestCase
{
    public function testGetImageVolumeAnnotationLabels()
    {
        $id = $this->volume()->id;
        $img = ImageTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);
        $a = ImageAnnotationTest::create(['image_id' => $img->id]);
        $l = LabelTest::create();
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/label-count");

        $this->beUser();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(403);

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                "id" => $l->id,
                "color" => $l->color,
                "name" => $l->name,
                "label_tree_id" => $l->label_tree_id,
                "count" => 2
            ]);
    }

    public function testGetVideoVolumeAnnotationLabels()
    {
        $id = $this->volume(['media_type_id' => MediaType::video()])->id;
        $vid = VideoTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);
        $a = VideoAnnotationTest::create(['video_id' => $vid->id]);
        $l = LabelTest::create();
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/label-count");

        $this->beUser();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(403);

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                "id" => $l->id,
                "color" => $l->color,
                "name" => $l->name,
                "label_tree_id" => $l->label_tree_id,
                "count" => 2
            ]);
    }

    public function testGetVideoVolumeAnnotationLabelsNoLabels()
    {
        $id = $this->volume(['media_type_id' => MediaType::video()])->id;
        VideoTest::create(['volume_id' => $this->volume()->id]);

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function testGetImageVolumeAnnotationLabelsNoLabels()
    {
        $id = $this->volume()->id;
        ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function testGetImageVolumeAnnotationLabelsSorting()
    {
        $id = $this->volume()->id;
        $img = ImageTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);
        $a = ImageAnnotationTest::create(['image_id' => $img->id]);
        $l1 = LabelTest::create(['name' => '1']);
        $l2 = LabelTest::create(['name' => '11']);
        $l3 = LabelTest::create(['name' => '2']);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l1->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l2->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l3->id]);

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(3)
            ->assertExactJson(
                [
                    [
                        "id" => $l1->id,
                        "color" => $l1->color,
                        "name" => $l1->name,
                        "label_tree_id" => $l1->label_tree_id,
                        "count" => 1
                    ],
                    [
                        "id" => $l3->id,
                        "color" => $l3->color,
                        "name" => $l3->name,
                        "label_tree_id" => $l3->label_tree_id,
                        "count" => 1
                    ],
                    [
                        "id" => $l2->id,
                        "color" => $l2->color,
                        "name" => $l2->name,
                        "label_tree_id" => $l2->label_tree_id,
                        "count" => 1
                    ]
                ]
            );
    }

    public function testGetVideoVolumeAnnotationLabelsSorting()
    {
        $id = $this->volume(['media_type_id' => MediaType::video()])->id;
        $vid = VideoTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);
        $a = VideoAnnotationTest::create(['video_id' => $vid->id]);
        $l1 = LabelTest::create(['name' => '1']);
        $l2 = LabelTest::create(['name' => '11']);
        $l3 = LabelTest::create(['name' => '2']);
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l1->id]);
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l2->id]);
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l3->id]);

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(3)
            ->assertExactJson(
                [
                    [
                        "id" => $l1->id,
                        "color" => $l1->color,
                        "name" => $l1->name,
                        "label_tree_id" => $l1->label_tree_id,
                        "count" => 1
                    ],
                    [
                        "id" => $l3->id,
                        "color" => $l3->color,
                        "name" => $l3->name,
                        "label_tree_id" => $l3->label_tree_id,
                        "count" => 1
                    ],
                    [
                        "id" => $l2->id,
                        "color" => $l2->color,
                        "name" => $l2->name,
                        "label_tree_id" => $l2->label_tree_id,
                        "count" => 1
                    ]
                ]
            );
    }

    public function testGetImageVolumeAnnotationLabelsAnnotationSession()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);

        $l1 = LabelTest::create(['name' => '1']);

        $l2 = LabelTest::create(['name' => '2']);

        $l3 = LabelTest::create(['name' => '3']);

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

        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'label_id' => $l1->id,
            'user_id' => $this->editor()->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l2->id,
            'user_id' => $this->editor()->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'label_id' => $l3->id,
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

        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertExactJson([
                [
                    "id" => $l2->id,
                    "color" => $l2->color,
                    "name" => $l2->name,
                    "label_tree_id" => $l2->label_tree_id,
                    "count" => 1
                ],
                [
                    "id" => $l3->id,
                    "color" => $l3->color,
                    "name" => $l3->name,
                    "label_tree_id" => $l3->label_tree_id,
                    "count" => 1
                ],
            ]);

        // test hide other
        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertExactJson([
                [
                    "id" => $l1->id,
                    "color" => $l1->color,
                    "name" => $l1->name,
                    "label_tree_id" => $l1->label_tree_id,
                    "count" => 1
                ],
                [
                    "id" => $l2->id,
                    "color" => $l2->color,
                    "name" => $l2->name,
                    "label_tree_id" => $l2->label_tree_id,
                    "count" => 1
                ],
            ]);

        // test hide both
        $session->hide_own_annotations = true;
        $session->save();

        $this->getJson("/api/v1/volumes/{$id}/label-count")
        ->assertStatus(200)
        ->assertExactJson([
            [
                "id" => $l2->id,
                "color" => $l2->color,
                "name" => $l2->name,
                "label_tree_id" => $l2->label_tree_id,
                "count" => 1
            ],
        ]);
    }

    public function testGetVideoVolumeAnnotationLabelsAnnotationSession()
    {
        $id = $this->volume(['media_type_id' => MediaType::video()])->id;
        $video = VideoTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);

        $l1 = LabelTest::create(['name' => '1']);

        $l2 = LabelTest::create(['name' => '2']);

        $l3 = LabelTest::create(['name' => '3']);

        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::yesterday(),
        ]);

        $a2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::today(),
        ]);

        $a3 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::yesterday(),
        ]);

        VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'label_id' => $l1->id,
            'user_id' => $this->editor()->id,
        ]);

        VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l2->id,
            'user_id' => $this->editor()->id,
        ]);

        VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'label_id' => $l3->id,
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

        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertExactJson([
                [
                    "id" => $l2->id,
                    "color" => $l2->color,
                    "name" => $l2->name,
                    "label_tree_id" => $l2->label_tree_id,
                    "count" => 1
                ],
                [
                    "id" => $l3->id,
                    "color" => $l3->color,
                    "name" => $l3->name,
                    "label_tree_id" => $l3->label_tree_id,
                    "count" => 1
                ],
            ]);

        // test hide other
        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertExactJson([
                [
                    "id" => $l1->id,
                    "color" => $l1->color,
                    "name" => $l1->name,
                    "label_tree_id" => $l1->label_tree_id,
                    "count" => 1
                ],
                [
                    "id" => $l2->id,
                    "color" => $l2->color,
                    "name" => $l2->name,
                    "label_tree_id" => $l2->label_tree_id,
                    "count" => 1
                ],
            ]);

        // test hide both
        $session->hide_own_annotations = true;
        $session->save();

        $this->getJson("/api/v1/volumes/{$id}/label-count")
        ->assertStatus(200)
        ->assertExactJson([
            [
                "id" => $l2->id,
                "color" => $l2->color,
                "name" => $l2->name,
                "label_tree_id" => $l2->label_tree_id,
                "count" => 1
            ],
        ]);
    }

    public function testGetImageVolumeAnnotationLabelsAnnotationSessionEdgeCaseHideOther()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);

        $l1 = LabelTest::create();

        $l2 = LabelTest::create();

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $l1->id,
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->admin()->id,
            'label_id' => $l2->id,
        ]);
        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::yesterday(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);
        $session->users()->attach($this->editor());

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertExactJson([
                [
                    "id" => $l1->id,
                    "color" => $l1->color,
                    "name" => $l1->name,
                    "label_tree_id" => $l1->label_tree_id,
                    "count" => 1
                ],
            ]);
    }

    public function testGetVideoVolumeAnnotationLabelsAnnotationSessionEdgeCaseHideOther()
    {
        $id = $this->volume(['media_type_id' => MediaType::video()])->id;
        $video = VideoTest::create(['volume_id' => $id]);

        $l1 = LabelTest::create();

        $l2 = LabelTest::create();

        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $l1->id,
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->admin()->id,
            'label_id' => $l2->id,
        ]);
        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::yesterday(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);
        $session->users()->attach($this->editor());

        $this->beEditor();
        $this->getJson("/api/v1/volumes/{$id}/label-count")
            ->assertStatus(200)
            ->assertExactJson([
                [
                    "id" => $l1->id,
                    "color" => $l1->color,
                    "name" => $l1->name,
                    "label_tree_id" => $l1->label_tree_id,
                    "count" => 1
                ],
            ]);
    }
}
