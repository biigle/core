<?php

namespace Biigle\Tests\Http\Controllers\Api\Annotations\Filters;

use ApiTestCase;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Carbon\Carbon;

class AnnotationControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        ImageAnnotationTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images/filter/annotations");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);
    }

    public function testIndexAnnotationSession()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2010-01-01',
        ]);
        ImageAnnotationLabelTest::create([
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

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::today(),
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $this->guest()->id,
        ]);

        $response = $this->get("/api/v1/volumes/{$id}/images/filter/annotations")
            ->assertExactJson([$image->id]);
    }
}
