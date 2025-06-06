<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;

class GetUsersWithAnnotationsTest extends ApiTestCase
{
    public function testGetUsersWithAnnotations()
    {
        // make sure the label tree and label are set up
        $this->labelRoot();
        $this->user();
        $user2 = UserTest::create();
        $user3 = UserTest::create();

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $imageAnnotation = ImageAnnotationTest::create(['image_id' => $image->id]);

        $imageAnnotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $imageAnnotation->id,
            'user_id' => $this->user()->id,
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

        $this->beGlobalGuest();
        $this->get('api/v1/volumes/'.$this->volume()->id.'/users-with-annotations')
            ->assertStatus(403);

        $this->beEditor();

        $expected = [[
            'user_id' => $this->user()->id,
            'name' => "{$this->user()->firstname} {$this->user()->lastname}"
        ]];
        $this->get('api/v1/volumes/'.$this->volume()->id.'/users-with-annotations')
            ->assertStatus(200)
            ->assertExactJson($expected);

        $expected = [[
            'user_id' => $user2->id,
            'name' => "{$user2->firstname} {$user2->lastname}"
        ]];
        $this->get('api/v1/volumes/'.$videoVolume->id.'/users-with-annotations')
            ->assertStatus(200)
            ->assertExactJson($expected);
    }
}
