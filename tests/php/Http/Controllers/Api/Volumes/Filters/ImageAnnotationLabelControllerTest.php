<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Filters;

use ApiTestCase;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Carbon\Carbon;

class ImageAnnotationLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $tid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);
        $label = LabelTest::create();
        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id,
        ]);
        // image ID should be returned only once, no matter how often the label is present
        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id,
        ]);

        $lid = $label->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = ImageAnnotationTest::create(['image_id' => $image2->id]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);
    }

    public function testIndexAnnotationSession()
    {
        $tid = $this->volume()->id;

        $session = AnnotationSessionTest::create([
            'volume_id' => $tid,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);
        $label = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $lid = $label->label_id;

        $this->beEditor();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}")
            ->assertExactJson([$image->id]);

        $session->users()->attach($this->editor());
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}")
            ->assertExactJson([]);
    }
}
