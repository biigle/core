<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\UserTest;
use Biigle\MediaType;

class StatisticsControllerTest extends ApiTestCase
{
    public function testStatistics()
    {
        $id = $this->volume()->id;

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/statistics");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/statistics");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/statistics")
            ->assertStatus(200);
        
        $expect = [
            'volumeType' => $this->volume()->isImageVolume() ? 'image' : 'video',
            'annotationTimeSeries' => [],
            'volumeAnnotations' => [],
            'volumeName' => [[
                'id' => $id,
                'name' => $this->volume()->name
            ]],
            'annotatedImages' => 0,
            'totalImages' => 0,
            'annotationLabels' => [],
            'sourceTargetLabels' => []
        ];
        $response->assertExactJson($expect);
    }

    public function testImageStatistics()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create([
            'volume_id' => $this->volume()->id,
        ]);

        // create another image on same volume
        ImageTest::create([
            'filename' => 'test-image2.jpg',
            'volume_id' => $this->volume()->id,
        ]);

        $user1 = UserTest::create();
        $user2 = UserTest::create();

        $annotation1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        // create label for annotations
        $annotationLabel1 = ImageAnnotationLabelTest::create([
            'user_id' => $user1->id,
            'annotation_id' => $annotation1->id,
        ]);

        $annotation2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $annotationLabel2 = ImageAnnotationLabelTest::create([
            'user_id' => $user2->id,
            'annotation_id' => $annotation2->id,
        ]);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/statistics")
            ->assertStatus(200);
        
        $expect = [
            'volumeType' => 'image',
            'annotationTimeSeries' => [
                [
                    'count' => 1,
                    'fullname' => $user1->firstname . " " . $user1->lastname,
                    'user_id' => $user1->id,
                    'year' => 2022
                ],
                [
                    'count' => 1,
                    'fullname' => $user2->firstname . " " . $user2->lastname,
                    'user_id' => $user2->id,
                    'year' => 2022
                ]
            ],
            'volumeAnnotations' => [
                [
                    "count" => 1,
                    "fullname" => $user1->firstname . " " . $user1->lastname,
                    "user_id" => $user1->id,
                    "volume_id" => $id
                ],
                [
                    "count" => 1,
                    "fullname" => $user2->firstname . " " . $user2->lastname,
                    "user_id" => $user2->id,
                    "volume_id" => $id
                ]
            ],
            'volumeName' => [[
                'name' => $this->volume()->name,
                'id' => $id
            ]],
            'annotatedImages' => 1,
            'totalImages' => 2,
            'annotationLabels' => [
                [
                    'color' => "0099ff",
                    'count' => 1,
                    'id' => $annotationLabel1->label->id,
                    'name' => $annotationLabel1->label->name
                ],
                [
                    'color' => "0099ff",
                    'count' => 1,
                    'id' => $annotationLabel2->label->id,
                    'name' => $annotationLabel2->label->name
                ]
            ],
            'sourceTargetLabels' => [
                $annotationLabel1->label->id => [$annotationLabel2->label->id]
            ]
        ];
        $response->assertExactJson($expect);
    }

    public function testVideoStatistics()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create([
            'volume_id' => $this->volume()->id,
        ]);

        // create another video on same volume
        VideoTest::create([
            'filename' => 'test-video2.mp4',
            'volume_id' => $this->volume()->id,
        ]);

        $user1 = UserTest::create();
        $user2 = UserTest::create();

        $annotation1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
        ]);

        // create label for annotations
        $annotationLabel1 = VideoAnnotationLabelTest::create([
            'user_id' => $user1->id,
            'annotation_id' => $annotation1->id,
        ]);

        $annotation2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
        ]);

        $annotationLabel2 = VideoAnnotationLabelTest::create([
            'user_id' => $user2->id,
            'annotation_id' => $annotation2->id,
        ]);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/statistics")
            ->assertStatus(200);
        
        $expect = [
            'volumeType' => 'video',
            'annotationTimeSeries' => [
                [
                    'count' => 1,
                    'fullname' => $user1->firstname . " " . $user1->lastname,
                    'user_id' => $user1->id,
                    'year' => 2022
                ],
                [
                    'count' => 1,
                    'fullname' => $user2->firstname . " " . $user2->lastname,
                    'user_id' => $user2->id,
                    'year' => 2022
                ]
            ],
            'volumeAnnotations' => [
                [
                    "count" => 1,
                    "fullname" => $user1->firstname . " " . $user1->lastname,
                    "user_id" => $user1->id,
                    "volume_id" => $id
                ],
                [
                    "count" => 1,
                    "fullname" => $user2->firstname . " " . $user2->lastname,
                    "user_id" => $user2->id,
                    "volume_id" => $id
                ]
            ],
            'volumeName' => [[
                'name' => $this->volume()->name,
                'id' => $id
            ]],
            'annotatedImages' => 1,
            'totalImages' => 2,
            'annotationLabels' => [
                [
                    'color' => "0099ff",
                    'count' => 1,
                    'id' => $annotationLabel1->label->id,
                    'name' => $annotationLabel1->label->name
                ],
                [
                    'color' => "0099ff",
                    'count' => 1,
                    'id' => $annotationLabel2->label->id,
                    'name' => $annotationLabel2->label->name
                ]
            ],
            'sourceTargetLabels' => [
                $annotationLabel1->label->id => [$annotationLabel2->label->id]
            ]
        ];
        $response->assertExactJson($expect);
    }
}
