<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\UserTest;
use Biigle\MediaType;
use Biigle\Role;

class GetUsersWithAnnotationsProjectsTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        // make sure the label tree and label are set up
        $this->labelRoot();
        $this->user1 = UserTest::create();
        $this->user2 = UserTest::create();
        $this->user3 = UserTest::create();

        $this->imageVolume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $this->project = ProjectTest::create();
        $this->project->addUserId($this->user1->id, Role::editorId());

        $this->project->addVolumeId($this->imageVolume->id);

        $image = ImageTest::create(['volume_id' => $this->imageVolume->id]);
        $this->imageAnnotation = ImageAnnotationTest::create(['image_id' => $image->id]);

        $this->imageAnnotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $this->imageAnnotation->id,
            'user_id' => $this->user1->id,
        ]);

        $this->videoVolume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
        ]);
        $this->project->addVolumeId($this->videoVolume->id);

        $video = VideoTest::create(['volume_id' => $this->videoVolume->id]);
        $this->videoAnnotation = VideoAnnotationTest::create(['video_id' => $video->id]);

        $this->videoAnnotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $this->videoAnnotation->id,
            'user_id' => $this->user2->id,
        ]);
    }

    public function testGetUsersWithAnnotations()
    {
        $this->beEditor();
        $this->get('api/v1/projects/'.$this->project->id.'/users-with-annotations')->assertStatus(403);

        $this->be($this->user1);
        $response = $this->get('api/v1/projects/'.$this->project->id.'/users-with-annotations')->assertStatus(200)->getContent();
        $expected = [['user_id' =>$this->user1->id, 'firstname' => $this->user1->firstname, 'lastname' => $this->user1->lastname],['user_id' =>$this->user2->id, 'firstname' => $this->user2->firstname, 'lastname' => $this->user2->lastname]];
        $this->assertEquals($expected, json_decode($response, true));
    }
}
