<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;

class UsedFileLabelsControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $vid = $this->volume()->id;

        $label1 = LabelTest::create(['name' => 'my-label']);
        $image = ImageTest::create(['volume_id' => $vid]);
        ImageLabelTest::create([
            'label_id' => $label1->id,
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create(['name' => 'other-label']);
        ImageLabelTest::create([
            'label_id' => $label2->id,
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/file-labels/");

        $this->beUser();
        $this->get("/api/v1/volumes/{$vid}/file-labels/")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$vid}/file-labels/")
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

    public function testIndexVideo()
    {
        $vid = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $label1 = LabelTest::create(['name' => 'my-label']);
        $video = VideoTest::create(['volume_id' => $vid]);
        VideoLabelTest::create([
            'label_id' => $label1->id,
            'video_id' => $video->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create(['name' => 'other-label']);
        VideoLabelTest::create([
            'label_id' => $label2->id,
            'video_id' => $video->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$vid}/file-labels/")
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
