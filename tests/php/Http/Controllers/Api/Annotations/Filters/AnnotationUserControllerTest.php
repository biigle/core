<?php

namespace Biigle\Tests\Http\Controllers\Api\Annotations\Filters;

use ApiTestCase;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\ImageTest;
use Carbon\Carbon;

class AnnotationUserControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $tid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        // image ID should be returned only once even with multiple annotations on it
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = AnnotationTest::create(['image_id' => $image2->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}")
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
        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $uid = $this->editor()->id;

        $this->beEditor();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}")
            ->assertExactJson([$image->id]);

        $session->users()->attach($this->editor());
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}")
            ->assertExactJson([]);
    }
}
