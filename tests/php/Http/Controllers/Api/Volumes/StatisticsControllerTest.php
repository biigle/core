<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;

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
            'annotatedFiles' => 0,
            'totalFiles' => 0,
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
                    'yearmonth' => $annotation1->created_at->year . "-" . sprintf("%02d", $annotation1->created_at->month),
                ],
                [
                    'count' => 1,
                    'fullname' => $user2->firstname . " " . $user2->lastname,
                    'user_id' => $user2->id,
                    'yearmonth' => $annotation2->created_at->year . "-" . sprintf("%02d", $annotation1->created_at->month),
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
            'annotatedFiles' => 1,
            'totalFiles' => 2,
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

    public function testImageStatisticsAggregates()
    {
        $id = $this->volume()->id;
        $image1 = ImageTest::create(['volume_id' => $id]);
        $image2 = ImageTest::create(['volume_id' => $id, 'filename' => 'test-image2.jpg']);
        $user = UserTest::create();
        $label1 = LabelTest::create();
        $label2 = LabelTest::create();
        $label3 = LabelTest::create();

        $a1 = ImageAnnotationTest::create(['image_id' => $image1->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a1->id, 'label_id' => $label1->id, 'user_id' => $user->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a1->id, 'label_id' => $label2->id, 'user_id' => $user->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image1->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $label3->id, 'user_id' => $user->id]);
        $a3 = ImageAnnotationTest::create(['image_id' => $image2->id]);
        // Label of a deleted user.
        ImageAnnotationLabelTest::create(['annotation_id' => $a3->id, 'label_id' => $label1->id, 'user_id' => null]);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/statistics")->assertStatus(200);

        $yearmonth = $a1->created_at->format('Y-m');
        $fullname = "{$user->firstname} {$user->lastname}";

        $response->assertJsonPath('annotatedFiles', 2);
        $response->assertJsonPath('totalFiles', 2);
        $response->assertJsonPath('annotationTimeSeries', [
            ['user_id' => $user->id, 'fullname' => $fullname, 'count' => 3, 'yearmonth' => $yearmonth],
            ['user_id' => null, 'fullname' => ' ', 'count' => 1, 'yearmonth' => $yearmonth],
        ]);
        $response->assertJsonPath('volumeAnnotations', [
            ['user_id' => $user->id, 'fullname' => $fullname, 'count' => 3, 'volume_id' => $id],
            ['user_id' => null, 'fullname' => ' ', 'count' => 1, 'volume_id' => $id],
        ]);
        $response->assertJsonPath('annotationLabels', [
            ['id' => $label1->id, 'name' => $label1->name, 'count' => 2, 'color' => $label1->color],
            ['id' => $label2->id, 'name' => $label2->name, 'count' => 1, 'color' => $label2->color],
            ['id' => $label3->id, 'name' => $label3->name, 'count' => 1, 'color' => $label3->color],
        ]);
        $response->assertJsonPath('sourceTargetLabels', [
            $label1->id => [$label2->id, $label3->id],
            $label2->id => [$label3->id],
        ]);
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
                    'yearmonth' => $annotation1->created_at->year . "-" . sprintf("%02d", $annotation1->created_at->month),
                ],
                [
                    'count' => 1,
                    'fullname' => $user2->firstname . " " . $user2->lastname,
                    'user_id' => $user2->id,
                    'yearmonth' => $annotation2->created_at->year . "-" . sprintf("%02d", $annotation1->created_at->month),
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
            'annotatedFiles' => 1,
            'totalFiles' => 2,
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
        $response->assertSimilarJson($expect);
    }
}
