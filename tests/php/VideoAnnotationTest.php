<?php

namespace Biigle\Tests;

use Biigle\Role;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Exception;
use ModelTestCase;

class VideoAnnotationTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = VideoAnnotation::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->video);
        $this->assertNotNull($this->model->shape);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->points);
        $this->assertNotNull($this->model->frames);
    }

    public function testLabels()
    {
        $this->assertFalse($this->model->labels()->exists());
        VideoAnnotationLabelTest::create([
            'annotation_id' => $this->model->id,
        ]);
        $this->assertTrue($this->model->labels()->exists());
    }

    public function testRoundPoints()
    {
        $this->model->points = [[1.23456789, 2.23456789, 3.1415]];
        $this->model->save();
        $this->assertEquals([[1.23, 2.23, 3.14]], $this->model->fresh()->points);
    }

    public function testValidatePointsFramesMismatch()
    {
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->frames = [0.0, 1.0];
        $this->model->validatePoints();
    }

    public function testValidatePointsWithGap()
    {
        $this->expectNotToPerformAssertions();
        $this->model->points = [[10, 10], [], [20, 20]];
        $this->model->frames = [0.0, null, 1.0];
        $this->model->validatePoints();
    }

    public function testValidatePointsPoint()
    {
        $this->model->shape_id = Shape::pointId();
        $this->model->points = [[10.5, 10.5]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10, 20, 20]];
        $this->model->validatePoints();
    }

    public function testValidatePointsCircle()
    {
        $this->model->shape_id = Shape::circleId();
        $this->model->points = [[10, 10, 20]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsRectangle()
    {
        $this->model->shape_id = Shape::rectangleId();
        $this->model->points = [[10, 10, 10, 20, 20, 20, 20, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsEllipse()
    {
        $this->model->shape_id = Shape::ellipseId();
        $this->model->points = [[10, 10, 10, 20, 20, 20, 20, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsLine()
    {
        $this->model->shape_id = Shape::lineId();
        $this->model->points = [[10, 10, 20, 20]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsPolygon()
    {
        $this->model->shape_id = Shape::polygonId();
        $this->model->points = [[10, 10, 20, 20, 30, 30, 10, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsPolygonFirstLastEqual()
    {
        $this->model->shape_id = Shape::polygonId();
        $this->model->points = [[10, 10, 20, 20, 30, 30, 10, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10, 20, 20, 30, 30]];
        $this->model->validatePoints();
    }

    public function testInterpolatePointsPoint()
    {
        $this->model->shape_id = Shape::pointId();
        $this->model->points = [[0, 0], [10, 10]];
        $this->model->frames = [0.0, 1.0];
        $this->assertEquals([5, 5], $this->model->interpolatePoints(0.5));
    }

    public function testInterpolatePointsInt()
    {
        $this->model->shape_id = Shape::pointId();
        $this->model->points = [[0, 0], [10, 10]];
        $this->model->frames = [0, 1];
        $this->assertEquals([10, 10], $this->model->interpolatePoints(1));
    }

    public function testInterpolatePointsRectangle()
    {
        $this->model->shape_id = Shape::rectangleId();
        $this->model->points = [
            [0, 0, 10, 0, 20, 20, 0, 20],
            [20, 10, 20, 20, 0, 20, 0, 10],
        ];
        $this->model->frames = [0.0, 1.0];

        $expect = [11.25, 5, 16.25, 10, 6.25, 20, 1.25, 15];
        $this->assertEquals($expect, $this->model->interpolatePoints(0.5));
    }

    public function testInterpolatePointsCircle()
    {
        $this->model->shape_id = Shape::circleId();
        $this->model->points = [[0, 0, 5], [10, 10, 10]];
        $this->model->frames = [0.0, 1.0];
        $this->assertEquals([5, 5, 7.5], $this->model->interpolatePoints(0.5));
    }

    public function testInterpolatePointsLineString()
    {
        $this->model->shape_id = Shape::lineId();
        $this->expectException(Exception::class);
        $this->model->interpolatePoints(0.5);
    }

    public function testInterpolatePointsPolygon()
    {
        $this->model->shape_id = Shape::polygonId();
        $this->expectException(Exception::class);
        $this->model->interpolatePoints(0.5);
    }

    public function testInterpolatePointsWholeFrame()
    {
        $this->model->shape_id = Shape::wholeFrameId();
        $this->expectException(Exception::class);
        $this->model->interpolatePoints(0.5);
    }

    public function testScopeAllowedBySessionHideOwn()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        // this should not be shown
        $a1 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a2 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $ids = VideoAnnotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertCount(2, $ids);
        $this->assertContains($a2->id, $ids);
        $this->assertContains($a3->id, $ids);
    }

    public function testScopeAllowedBySessionHideOther()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        // this should be shown
        $a1 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a2 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        // this should not be shown
        $a4 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);

        $ids = VideoAnnotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertCount(2, $ids);
        $this->assertContains($a1->id, $ids);
        $this->assertContains($a3->id, $ids);
    }

    public function testScopeAllowedBySessionHideBoth()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        // this should not be shown
        $a1 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a2 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        // this should not be shown
        $a4 = static::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $ids = VideoAnnotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertEquals([$a3->id], $ids);
    }

    public function testScopeVisibleFor()
    {
        $video = VideoTest::create();
        $user = UserTest::create();
        $admin = UserTest::create(['role_id' => Role::adminId()]);
        $otherUser = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($user->id, Role::editorId());
        $project->addVolumeId($video->volume_id);

        $a = static::create([
            'video_id' => $video->id,
        ]);

        $this->assertEmpty(VideoAnnotation::visibleFor($otherUser)->pluck('video_annotations.id'));
        $this->assertTrue(VideoAnnotation::visibleFor($user)->where('video_annotations.id', $a->id)->exists());
        $this->assertTrue(VideoAnnotation::visibleFor($admin)->where('video_annotations.id', $a->id)->exists());
    }

    public function testScopeWithLabel()
    {
        $al1 = VideoAnnotationLabelTest::create();
        $al2 = VideoAnnotationLabelTest::create();

        $this->assertEquals($al1->annotation->id, VideoAnnotation::withLabel($al1->label)->first()->id);
    }

    public function testGetPoints()
    {
        $annotation = static::make(['points' => [[1, 2]]]);
        $this->assertEquals([[1, 2]], $annotation->getPoints());
    }

    public function testGetShape()
    {
        $this->assertEquals($this->model->shape, $this->model->getShape());
    }

    public function testGetFile()
    {
        $this->assertEquals($this->model->video, $this->model->getFile());
    }

    public function testGetFileIdAttribute()
    {
        $this->assertEquals($this->model->video_id, $this->model->file_id);
    }
}
