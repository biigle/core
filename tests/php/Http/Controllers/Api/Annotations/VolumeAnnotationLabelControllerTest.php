<?php

namespace Biigle\Tests\Http\Controllers\Api\Annotations;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;

class VolumeAnnotationLabelControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $tid = $this->volume()->id;

        $label1 = LabelTest::create();
        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create([
            'label_id' => $label1->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create();
        ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/annotation-labels");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$tid}/annotation-labels");
        $response->assertStatus(403);

        $this->beGuest();

        $response = $this->get("/api/v1/volumes/{$tid}/annotation-labels/")
            ->assertSimilarJson([
                [
                    'id' => $label1->id,
                    'name' => $label1->name,
                    'color' => $label1->color,
                    'parent_id' => $label1->parent_id,
                ],
                [
                    'id' => $label2->id,
                    'name' => $label2->name,
                    'color' => $label2->color,
                    'parent_id' => $label2->parent_id,
                ],
            ]);
        $response->assertStatus(200);
    }

    public function testIndexVideo()
    {
        $tid = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $label1 = LabelTest::create();
        $video = VideoTest::create(['volume_id' => $tid]);
        $annotation = VideoAnnotationTest::create(['video_id' => $video->id]);
        VideoAnnotationLabelTest::create([
            'label_id' => $label1->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create();
        VideoAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$tid}/annotation-labels/")
            ->assertStatus(200)
            ->assertSimilarJson([
                [
                    'id' => $label1->id,
                    'name' => $label1->name,
                    'color' => $label1->color,
                    'parent_id' => $label1->parent_id,
                ],
                [
                    'id' => $label2->id,
                    'name' => $label2->name,
                    'color' => $label2->color,
                    'parent_id' => $label2->parent_id,
                ],
            ]);
    }
}
