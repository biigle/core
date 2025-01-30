<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;

class ProjectAnnotationLabelsTest extends ApiTestCase
{
    public function testGetProjectAnnotationLabels()
    {
        $id = $this->project()->id;
        $img = ImageTest::create(['volume_id' => $this->volume()->id, 'filename' => 'abc.jpg']);
        $a = ImageAnnotationTest::create(['image_id' => $img]);
        $l = LabelTest::create();
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $videoVolume = VolumeTest::create(['media_type_id' => MediaType::video(), 'creator_id' => $this->volume()->creator_id]);
        $this->project()->volumes()->attach($videoVolume->id);
        $vid = VideoTest::create(['volume_id' => $videoVolume, 'filename' => 'abc.jpg']);
        $a2 = VideoAnnotationTest::create(['video_id' => $vid]);
        $l2 = LabelTest::create();
        VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l2->id]);

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/label-count");

        $this->beUser();
        $this->getJson("/api/v1/projects/{$id}/label-count")
            ->assertStatus(403);

        $this->beEditor();

        $this->getJson("/api/v1/projects/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonFragment([
                "id" => $l->id,
                "color" => $l->color,
                "name" => $l->name,
                "label_tree_id" => $l->label_tree_id,
                "count" => 1
            ])
            ->assertJsonFragment([
                "id" => $l2->id,
                "color" => $l2->color,
                "name" => $l2->name,
                "label_tree_id" => $l2->label_tree_id,
                "count" => 1
            ]);
    }

    public function testGetProjectAnnotationLabelsOnlyImages()
    {
        $id = $this->project()->id;
        $img = ImageTest::create(['volume_id' => $this->volume()->id, 'filename' => 'abc2.jpg']);
        $a = ImageAnnotationTest::create(['image_id' => $img]);
        $l = LabelTest::create();
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $this->beEditor();

        $this->getJson("/api/v1/projects/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                "id" => $l->id,
                "color" => $l->color,
                "name" => $l->name,
                "label_tree_id" => $l->label_tree_id,
                "count" => 1
            ]);
    }

    public function testGetProjectAnnotationLabelsOnlyVideos()
    {
        $id = $this->project()->id;
        $volId = $this->volume(['media_type_id' => MediaType::video()])->id;
        $vid = VideoTest::create(['volume_id' => $volId, 'filename' => 'abc2.jpg']);
        $a = VideoAnnotationTest::create(['video_id' => $vid]);
        $l = LabelTest::create();
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $this->beEditor();

        $this->getJson("/api/v1/projects/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                "id" => $l->id,
                "color" => $l->color,
                "name" => $l->name,
                "label_tree_id" => $l->label_tree_id,
                "count" => 1
            ]);
    }

    public function testGetProjectAnnotationLabelsNoLabels()
    {
        $this->beEditor();
        $this->getJson("/api/v1/projects/{$this->project()->id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function testGetProjectAnnotationLabelsSorting()
    {
        $id = $this->project()->id;
        $img = ImageTest::create(['volume_id' => $this->volume()->id, 'filename' => 'abc.jpg']);
        $a = ImageAnnotationTest::create(['image_id' => $img]);
        $l1 = LabelTest::create(['name' => '1']);
        $l3 = LabelTest::create(['name' => '11']);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l1->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l3->id]);

        $videoVolume = VolumeTest::create(['media_type_id' => MediaType::video(), 'creator_id' => $this->volume()->creator_id]);
        $this->project()->volumes()->attach($videoVolume->id);
        $vid = VideoTest::create(['volume_id' => $videoVolume, 'filename' => 'abc.jpg']);
        $a2 = VideoAnnotationTest::create(['video_id' => $vid]);
        $l2 = LabelTest::create(['name' => '2']);
        VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l2->id]);

        $this->beEditor();
        $this->getJson("/api/v1/projects/{$id}/label-count")
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
                    ]
                ]
            );
    }
}
