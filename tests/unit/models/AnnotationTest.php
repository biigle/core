<?php

use Dias\Annotation;
use Dias\Shape;

class AnnotationTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\Annotation::class;

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

    public function testProjectIds()
    {
        $project = ProjectTest::create();
        $transect = $this->model->image->transect;
        $this->assertEmpty($this->model->projectIds());
        $project->addTransectId($transect->id);
        // clear caching of previous call
        Cache::flush();
        $ids = $this->model->projectIds();
        $this->assertNotEmpty($ids);
        $this->assertEquals($project->id, $ids[0]);
    }

    public function testValidatePointsInteger()
    {
        $this->setExpectedException('Exception');
        $this->model->validatePoints([10, 'a']);
    }

    public function testValidatePointsPoint()
    {
        $this->model->shape_id = Shape::$pointId;
        $this->model->validatePoints([10, 10]);
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

    public function testAddLabel()
    {
        $label = LabelTest::create();
        $user = UserTest::create();
        $confidence = 0.1;
        $this->assertEquals(0, $this->model->labels()->count());
        $point = $this->model->addLabel($label->id, $confidence, $user);
        $this->assertEquals(1, $this->model->labels()->count());
        $l = $this->model->labels()->first();
        $this->assertEquals($label->id, $l->id);
        $this->assertEquals($confidence, $l->confidence);
        $this->assertEquals($user->id, $l->user_id);
    }
}
