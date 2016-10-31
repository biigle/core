<?php

use Dias\Shape;
use Dias\Annotation;

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
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->shape()->delete();
    }

    public function testCastPoints()
    {
        $annotation = static::make();
        $annotation->points = [1, 2, 3, 4];
        $annotation->save();
        $this->assertEquals([1, 2, 3, 4], $annotation->fresh()->points);
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
        $this->setExpectedException('Exception');
        $this->model->validatePoints([10, 'a']);
    }

    public function testValidatePointsPoint()
    {
        $this->model->shape_id = Shape::$pointId;
        $this->model->validatePoints([10.5, 10.5]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([10, 10, 20, 20]);
    }

    public function testValidatePointsCircle()
    {
        $this->model->shape_id = Shape::$circleId;
        $this->model->validatePoints([10, 10, 20]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([10, 10]);
    }

    public function testValidatePointsRectangle()
    {
        $this->model->shape_id = Shape::$rectangleId;
        $this->model->validatePoints([10, 10, 10, 20, 20, 20, 20, 10]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([10, 10]);
    }

    public function testValidatePointsLine()
    {
        $this->model->shape_id = Shape::$lineId;
        $this->model->validatePoints([10, 10]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([10]);
    }

    public function testValidatePointsPolygon()
    {
        $this->model->shape_id = Shape::$polygonId;
        $this->model->validatePoints([10, 10]);
        $this->setExpectedException('Exception');
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
            'transect_id' => $image->transect->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $ids = Annotation::allowedBySession($session, $ownUser)
            ->orderBy('id', 'asc')
            ->pluck('id')
            ->toArray();
        $expect = [$a2->id, $a3->id];
        sort($expect);
        $this->assertEquals($expect, $ids);
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
            'transect_id' => $image->transect->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);

        $ids = Annotation::allowedBySession($session, $ownUser)
            ->orderBy('id', 'asc')
            ->pluck('id')
            ->toArray();
        $expect = [$a1->id, $a3->id];
        sort($expect);
        $this->assertEquals($expect, $ids);
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
            'transect_id' => $image->transect->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $ids = Annotation::allowedBySession($session, $ownUser)->pluck('id')->toArray();
        $this->assertEquals([$a3->id], $ids);
    }
}
