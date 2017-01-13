<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers;

use Biigle\Role;
use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationSessionTest;

class AnnotationControllerTest extends ApiTestCase {

    public function testIndex() {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);
        $project->addVolumeId($volume->id);
        // not logged in
        $this->get('annotate/'.$image->id);
        $this->assertResponseStatus(302);

        // doesn't belong to project
        $this->be(UserTest::create());
        $this->get('annotate/'.$image->id);
        $this->assertResponseStatus(403);

        $this->be($project->creator);
        $this->get('annotate/'.$image->id);
        $this->assertResponseOk();
        $this->assertViewHas('user');
        $this->assertViewHas('image');

        // doesn't exist
        $this->get('annotate/-1');
        $this->assertResponseStatus(404);
    }

    public function testShow() {
        $annotation = AnnotationTest::create();
        $this->project()->addVolumeId($annotation->image->volume_id);

        $this->beUser();
        $this->json('GET', 'annotations/'.$annotation->id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('annotations/'.$annotation->id);
        $this->assertRedirectedTo('annotate/'.$annotation->image_id.'?annotation='.$annotation->id);
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
        $this->get("annotations/{$annotation->id}");
        $this->assertResponseStatus(403);
    }

}
