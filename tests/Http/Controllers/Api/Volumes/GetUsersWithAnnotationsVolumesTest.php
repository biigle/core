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
use Biigle\Role;
use Biigle\MediaType;

class GetUsersWithAnnotationsVolumesTest extends ApiTestCase
{
    public function testGetUsersWithAnnotations()
    {
        // make sure the label tree and label are set up
        $this->labelRoot();
        $user = $this->newProjectUser();
        $user2 = $this->newProjectUser();
        $user3 = $this->newProjectUser();

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $imageAnnotation = ImageAnnotationTest::create(['image_id' => $image->id]);

        $imageAnnotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $imageAnnotation->id,
            'user_id' => $user->id,
        ]);

        $videoVolume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
        ]);
        $this->project()->addVolumeId($videoVolume->id);

        $video = VideoTest::create(['volume_id' => $videoVolume->id]);
        $videoAnnotation = VideoAnnotationTest::create(['video_id' => $video->id]);

        $this->videoAnnotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $videoAnnotation->id,
            'user_id' => $user2->id,
        ]);

        $this->beEditor();
        $this->get('api/v1/volumes/'.$this->volume()->id.'/users-with-annotations')->assertStatus(403);

        $this->be($user);
        $response = $this->get('api/v1/volumes/'.$this->volume()->id.'/users-with-annotations')->assertStatus(200)->getContent();
        $expected = [['user_id' =>$user->id, 'firstname' => $user->firstname, 'lastname' => $user->lastname]];
        $this->assertJsonEquals($expected, $response);

        $response = $this->get('api/v1/volumes/'.$this->videoVolume->id.'/users-with-annotations')->assertStatus(200)->getContent();
        $expected = [['user_id' =>$user2->id, 'firstname' => $user2->firstname, 'lastname' => $user2->lastname]];
        $this->assertExactJson($expected, $response);
    }
}
