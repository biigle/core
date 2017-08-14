<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers\Api;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class VolumeImageControllerTest extends ApiTestCase
{
    public function testHasAnnotation()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        AnnotationTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/filter/annotations");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations");
        $response->assertStatus(403);

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations")
            ->assertExactJson($expect);
        $response->assertStatus(200);
    }

    public function testHasAnnotationAnnotationSession()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        $a = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2010-01-01',
        ]);
        AnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $this->guest()->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations")
            ->assertJsonMissing([]);

        $session->users()->attach($this->guest());
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations")
            ->assertExactJson([]);

        $a = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::today(),
        ]);
        AnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $this->guest()->id,
        ]);

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations")
            ->assertExactJson($expect);
    }

    public function testHasAnnotationUser()
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

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}")
            ->assertExactJson($expect);
        $response->assertStatus(200);
    }

    public function testHasAnnotationUserAnnotationSession()
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

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->beEditor();
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}")
            ->assertExactJson($expect);

        $session->users()->attach($this->editor());
        $response = $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-user/{$uid}")
            ->assertExactJson([]);
    }
}
