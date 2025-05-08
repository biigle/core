<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

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
    public function testGetUsersWithAnnotations(): void
    {
        // make sure the label tree and label are set up
        $this->labelRoot();
        $this->user();
        $user2 = UserTest::create();
        $user3 = UserTest::create();

        $image = ImageTest::create(
            ['volume_id' => $this->volume(
                ['media_type_id' => MediaType::imageId()]
            )->id]
        );
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

        $videoAnnotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $videoAnnotation->id,
            'user_id' => $user2->id,
        ]);

        $this->beGlobalGuest();
        $this->get('api/v1/projects/'.$this->project()->id.'/users-with-annotations')
            ->assertStatus(403);

        $this->beEditor();

        $expected = [
            ['user_id' => $this->user()->id, 'name' => "{$this->user()->firstname} {$this->user()->lastname}"],
            ['user_id' => $user2->id, 'name' => "{$user2->firstname} {$user2->lastname}"],
        ];
        $response = $this->get('api/v1/projects/'.$this->project()->id.'/users-with-annotations')
            ->assertStatus(200);
        $json = $response->json();
        usort($json, fn ($a, $b) => $a['user_id'] <=> $b['user_id']);
        $this->assertEquals($json, $expected);
    }
}
