<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationSessionTest;

class AnnotationControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);
        $project->addVolumeId($volume->id);
        // not logged in
        $response = $this->get('annotate/'.$image->id);
        $response->assertStatus(302);

        // doesn't belong to project
        $this->be(UserTest::create());
        $response = $this->get('annotate/'.$image->id);
        $response->assertStatus(403);

        $this->be($project->creator);
        $response = $this->get('annotate/'.$image->id);
        $response->assertStatus(200);
        $response->assertViewHas('user');
        $response->assertViewHas('image');

        // doesn't exist
        $response = $this->get('annotate/-1');
        $response->assertStatus(404);
    }

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
        $this->project()->addVolumeId($annotation->image->volume_id);

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
    }
}
