<?php

namespace Biigle\Tests;

use Biigle\Shape;
use ModelTestCase;
use Illuminate\Database\QueryException;

class ShapeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Shape::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testPointId()
    {
        $this->assertNotNull(Shape::$pointId);
    }

    public function testLineId()
    {
        $this->assertNotNull(Shape::$lineId);
    }

    public function testPolygonId()
    {
        $this->assertNotNull(Shape::$polygonId);
    }

    public function testCircleId()
    {
        $this->assertNotNull(Shape::$circleId);
    }

    public function testRectangleId()
    {
        $this->assertNotNull(Shape::$rectangleId);
    }

    public function testEllipseId()
    {
        $this->assertNotNull(Shape::$ellipseId);
    }
}
