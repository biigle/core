<?php

use Dias\Annotation;
use Dias\Shape;

class AnnotationTest extends ModelWithAttributesTest
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

    public function testPoints()
    {
        $this->assertEquals(0, $this->model->unorderedPoints()->count());
        AnnotationPointTest::create([
            'annotation_id' => $this->model->id,
            'index' => 0,
        ]);
        $this->assertEquals(1, $this->model->unorderedPoints()->count());
        AnnotationPointTest::create([
            'annotation_id' => $this->model->id,
            'index' => 1,
        ]);
        $this->assertEquals(2, $this->model->unorderedPoints()->count());
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

    public function testAddPoint()
    {
        $this->assertEquals(0, $this->model->unorderedPoints()->count());
        // float will be converted to int
        $point = $this->model->addPoint(10.5, 10.22);
        $this->assertEquals($this->model->id, $point->annotation->id);
        $this->assertEquals(1, $this->model->unorderedPoints()->count());
        $this->assertEquals(0, $point->index);
        // the next point should get the next highest index
        $point = $this->model->addPoint(20, 20);
        $this->assertEquals(2, $this->model->unorderedPoints()->count());
        $this->assertEquals(1, $point->index);
    }

    public function testAddPoints()
    {
        $this->assertEquals(0, $this->model->unorderedPoints()->count());
        $this->model->addPoints([['x' => 10, 'y' => 10]]);
        $this->assertEquals(1, $this->model->unorderedPoints()->count());
        $this->model->addPoints([(object) ['x' => 10, 'y' => 10]]);
        $this->assertEquals(2, $this->model->unorderedPoints()->count());
    }

    public function testValidatePointsProperty()
    {
        $this->model->validatePoints([['x' => 10, 'y' => 10]]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([['x' => 10, 'z' => 10]]);
    }

    public function testValidatePointsNumeric()
    {
        $this->model->validatePoints([['x' => 10, 'y' => 10]]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([['x' => 'ab', 'y' => 10]]);
    }

    public function testValidatePointsPoint()
    {
        $this->model->shape_id = Shape::$pointId;
        $this->model->validatePoints([['x' => 10, 'y' => 10]]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([['x' => 10, 'y' => 10], ['x' => 20, 'y' => 20]]);
    }

    public function testValidatePointsCircle()
    {
        $this->model->shape_id = Shape::$circleId;
        $this->model->validatePoints([['x' => 10, 'y' => 10], ['x' => 20, 'y' => 20]]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([['x' => 10, 'y' => 10]]);
    }

    public function testValidatePointsRectangle()
    {
        $this->model->shape_id = Shape::$rectangleId;
        $this->model->validatePoints([['x' => 10, 'y' => 10], ['x' => 20, 'y' => 20], ['x' => 10, 'y' => 10], ['x' => 20, 'y' => 20]]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([['x' => 10, 'y' => 10]]);
    }

    public function testValidatePointsLine()
    {
        $this->model->shape_id = Shape::$lineId;
        $this->model->validatePoints([['x' => 10, 'y' => 10]]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([]);
    }

    public function testValidatePointsPolygon()
    {
        $this->model->shape_id = Shape::$polygonId;
        $this->model->validatePoints([['x' => 10, 'y' => 10]]);
        $this->setExpectedException('Exception');
        $this->model->validatePoints([]);
    }

    public function testRefreshPoints()
    {
        $this->model->addPoints([['x' => 10, 'y' => 10], ['x' => 20, 'y' => 20]]);
        $this->assertEquals(2, $this->model->unorderedPoints()->count());
        $this->model->refreshPoints([['x' => 100, 'y' => 100], ['x' => 200, 'y' => 200]]);
        $this->assertEquals(2, $this->model->unorderedPoints()->count());
        $points = $this->model->points->toArray();
        $this->assertEquals(100, $points[0]['x']);
        $this->assertEquals(200, $points[1]['x']);
        $this->model->refreshPoints([]);
        $this->assertEquals(2, $this->model->unorderedPoints()->count());
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
