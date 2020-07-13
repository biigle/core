<?php

namespace Biigle\Tests;

use Biigle\Annotation;
use Biigle\Role;
use Biigle\Shape;
use Exception;
use Illuminate\Database\QueryException;
use ModelTestCase;

class AnnotationTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Annotation::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->image);
        $this->assertNotNull($this->model->shape);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testImageOnDeleteCascade()
    {
        $this->assertNotNull(Annotation::find($this->model->id));
        $this->model->image()->delete();
        $this->assertNull(Annotation::find($this->model->id));
    }

    public function testShapeOnDeleteRestrict()
    {
        $this->expectException(QueryException::class);
        $this->model->shape()->delete();
    }

    public function testCastPoints()
    {
        $annotation = static::make();
        $annotation->points = [1, 2, 3, 4];
        $annotation->save();
        $this->assertEquals([1, 2, 3, 4], $annotation->fresh()->points);
    }

    public function testRoundPoints()
    {
        $annotation = static::make();
        $annotation->points = [1.23456789, 2.23456789, 3.1415];
        $annotation->save();
        $this->assertEquals([1.23, 2.23, 3.14], $annotation->fresh()->points);
    }

    public function testLabels()
    {
        $label = LabelTest::create();
        $user = UserTest::create();
        $this->modelLabel = AnnotationLabelTest::create([
            'annotation_id' => $this->model->id,
            'label_id' => $label->id,
            'user_id' => $user->id,
            'confidence' => 0.5,
        ]);
        $this->modelLabel->save();
        $this->assertEquals(1, $this->model->labels()->count());
        $label = $this->model->labels()->first();
        $this->assertEquals(0.5, $label->confidence);
        $this->assertEquals($user->id, $label->user->id);
    }

    public function testValidatePointsInteger()
    {
        $this->expectException(Exception::class);
        $this->model->validatePoints([10, 'a']);
    }

    public function testValidatePointsPoint()
    {
        $this->model->shape_id = Shape::pointId();
        $this->model->validatePoints([10.5, 10.5]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10, 10, 20, 20]);
    }

    public function testValidatePointsCircle()
    {
        $this->model->shape_id = Shape::circleId();
        $this->model->validatePoints([10, 10, 20]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10, 10]);
    }

    public function testValidatePointsRectangle()
    {
        $this->model->shape_id = Shape::rectangleId();
        $this->model->validatePoints([10, 10, 10, 20, 20, 20, 20, 10]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10, 10]);
    }

    public function testValidatePointsEllipse()
    {
        $this->model->shape_id = Shape::ellipseId();
        $this->model->validatePoints([10, 10, 10, 20, 20, 20, 20, 10]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10, 10]);
    }

    public function testValidatePointsLine()
    {
        $this->model->shape_id = Shape::lineId();
        $this->model->validatePoints([10, 10]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10]);
    }

    public function testValidatePointsPolygon()
    {
        $this->model->shape_id = Shape::polygonId();
        $this->model->validatePoints([10, 10]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10]);
    }

    public function testAllowedBySessionScopeHideOwn()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should not be shown
        $a1 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a2 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $image->volume->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $ids = Annotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertCount(2, $ids);
        $this->assertContains($a2->id, $ids);
        $this->assertContains($a3->id, $ids);
    }

    public function testAllowedBySessionScopeHideOther()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should be shown
        $a1 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a2 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        // this should not be shown
        $a4 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = AnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $image->volume->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);

        $ids = Annotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertCount(2, $ids);
        $this->assertContains($a1->id, $ids);
        $this->assertContains($a3->id, $ids);
    }

    public function testAllowedBySessionScopeHideBoth()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should not be shown
        $a1 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a2 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        // this should not be shown
        $a4 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = AnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $image->volume->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $ids = Annotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertEquals([$a3->id], $ids);
    }

    public function testScopeVisibleFor()
    {
        $image = ImageTest::create();
        $user = UserTest::create();
        $admin = UserTest::create(['role_id' => Role::adminId()]);
        $otherUser = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($user->id, Role::editorId());
        $project->addVolumeId($image->volume_id);

        $a = static::create([
            'image_id' => $image->id,
        ]);

        $this->assertEmpty(Annotation::visibleFor($otherUser)->pluck('annotations.id'));
        $this->assertTrue(Annotation::visibleFor($user)->where('annotations.id', $a->id)->exists());
        $this->assertTrue(Annotation::visibleFor($admin)->where('annotations.id', $a->id)->exists());
    }

    public function testScopeWithLabel()
    {
        $al1 = AnnotationLabelTest::create();
        $al2 = AnnotationLabelTest::create();

        $this->assertEquals($al1->annotation->id, Annotation::withLabel($al1->label)->first()->id);
    }

    public function testGetPoints()
    {
        $annotation = static::make(['points' => [1, 2]]);
        $this->assertEquals([1, 2], $annotation->getPoints());
    }

    public function testGetShape()
    {
        $this->assertEquals($this->model->shape, $this->model->getShape());
    }

    public function testGetImage()
    {
        $this->assertEquals($this->model->image, $this->model->getImage());
    }
}
