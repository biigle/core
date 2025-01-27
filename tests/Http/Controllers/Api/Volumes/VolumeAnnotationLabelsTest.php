<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;

class VolumeAnnotationLabelsTest extends ApiTestCase
{
    public function testGetImageVolumeAnnotationLabels()
    {
        $id = $this->volume()->id;
        $img = ImageTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);
        $a = ImageAnnotationTest::create(['image_id' => $img]);
        $l = LabelTest::create();
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $this->doTestApiRoute('GET', "/api/v1/volume/{$id}/label-count");

        $this->beUser();
        $this->getJson("/api/v1/volume/{$id}/label-count")
            ->assertStatus(403);

        $this->beEditor();
        $this->getJson("/api/v1/volume/{$id}/label-count")
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
        $a = VideoAnnotationTest::create(['video_id' => $vid]);
        $l = LabelTest::create();
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);
        VideoAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $this->doTestApiRoute('GET', "/api/v1/volume/{$id}/label-count");

        $this->beUser();
        $this->getJson("/api/v1/volume/{$id}/label-count")
            ->assertStatus(403);

        $this->beEditor();
        $this->getJson("/api/v1/volume/{$id}/label-count")
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
        $this->getJson("/api/v1/volume/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function testGetImageVolumeAnnotationLabelsNoLabels()
    {
        $id = $this->volume()->id;
        ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->beEditor();
        $this->getJson("/api/v1/volume/{$id}/label-count")
            ->assertStatus(200)
            ->assertJsonCount(0);
    }

}
