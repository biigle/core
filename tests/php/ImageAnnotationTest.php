<?php

namespace Biigle\Tests;

use Biigle\ImageAnnotation;
use Biigle\Role;
use Biigle\Shape;
use Exception;
use Illuminate\Database\QueryException;
use ModelTestCase;

class ImageAnnotationTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = ImageAnnotation::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->image);
        $this->assertNotNull($this->model->shape);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testImageOnDeleteCascade()
    {
        $this->assertNotNull(ImageAnnotation::find($this->model->id));
        $this->model->image()->delete();
        $this->assertNull(ImageAnnotation::find($this->model->id));
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
        $this->modelLabel = ImageAnnotationLabelTest::create([
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
        $this->model->validatePoints([10, 10, 20, 20]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10]);
    }

    public function testValidatePointsPolygon()
    {
        $this->model->shape_id = Shape::polygonId();
        $this->model->validatePoints([10, 10, 20, 20, 30, 30, 10, 10]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10, 10]);
    }

    public function testValidatePointsPolygonFirstLastEqual()
    {
        $this->model->shape_id = Shape::polygonId();
        $this->model->validatePoints([10, 10, 20, 20, 30, 30, 10, 10]);
        $this->expectException(Exception::class);
        $this->model->validatePoints([10, 10, 20, 20, 30, 30]);
    }

    public function testScopeAllowedBySessionHideOwn()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should not be shown
        $a1 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a2 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = ImageAnnotationLabelTest::create([
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

        $ids = ImageAnnotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertCount(2, $ids);
        $this->assertContains($a2->id, $ids);
        $this->assertContains($a3->id, $ids);
    }

    public function testScopeAllowedBySessionHideOther()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should be shown
        $a1 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a2 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        // this should not be shown
        $a4 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = ImageAnnotationLabelTest::create([
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

        $ids = ImageAnnotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertCount(2, $ids);
        $this->assertContains($a1->id, $ids);
        $this->assertContains($a3->id, $ids);
    }

    public function testScopeAllowedBySessionHideBoth()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should not be shown
        $a1 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a2 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown
        $a3 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        // this should not be shown
        $a4 = static::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = ImageAnnotationLabelTest::create([
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

        $ids = ImageAnnotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
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

        $this->assertEmpty(ImageAnnotation::visibleFor($otherUser)->pluck('image_annotations.id'));
        $this->assertTrue(ImageAnnotation::visibleFor($user)->where('image_annotations.id', $a->id)->exists());
        $this->assertTrue(ImageAnnotation::visibleFor($admin)->where('image_annotations.id', $a->id)->exists());
    }

    public function testScopeWithLabel()
    {
        $al1 = ImageAnnotationLabelTest::create();
        $al2 = ImageAnnotationLabelTest::create();

        $this->assertEquals($al1->annotation->id, ImageAnnotation::withLabel($al1->label)->first()->id);
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

    public function testGetFile()
    {
        $this->assertEquals($this->model->image, $this->model->getFile());
    }

    public function testGetFileIdAttribute()
    {
        $this->assertEquals($this->model->image_id, $this->model->file_id);
    }
}
