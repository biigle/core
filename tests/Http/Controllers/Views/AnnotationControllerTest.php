<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers\Views;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class AnnotationControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $annotation = AnnotationTest::create();
        $this->project()->addVolumeId($annotation->image->volume_id);

        $this->beUser();
        $response = $this->json('GET', 'annotations/'.$annotation->id);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get('annotations/'.$annotation->id);
        $response->assertRedirect('annotate/'.$annotation->image_id.'?annotation='.$annotation->id);
    }

    public function testShowAnnotationSession()
    {
        $annotation = AnnotationTest::create([
            'created_at' => Carbon::yesterday(),
        ]);
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);
        $this->project()->addVolumeId($annotation->image->volume_id);

        $annotation2 = AnnotationTest::create([
            'image_id' => $annotation->image_id,
            'created_at' => Carbon::today(),
        ]);
        AnnotationLabelTest::create([
            'annotation_id' => $annotation2->id,
            'user_id' => $this->admin()->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $annotation->image->volume_id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $session->users()->attach($this->admin());

        $this->beAdmin();
        $response = $this->get("annotations/{$annotation->id}");
        $response->assertStatus(403);

        $response = $this->get("annotations/{$annotation2->id}");
        $response->assertStatus(302);
    }
}
