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

    public function testPoint()
    {
        $this->assertNotNull(Shape::point());
        $this->assertNotNull(Shape::pointId());
    }

    public function testLine()
    {
        $this->assertNotNull(Shape::line());
        $this->assertNotNull(Shape::lineId());
    }

    public function testPolygon()
    {
        $this->assertNotNull(Shape::polygon());
        $this->assertNotNull(Shape::polygonId());
    }

    public function testCircle()
    {
        $this->assertNotNull(Shape::circle());
        $this->assertNotNull(Shape::circleId());
    }

    public function testRectangle()
    {
        $this->assertNotNull(Shape::rectangle());
        $this->assertNotNull(Shape::rectangleId());
    }

    public function testEllipse()
    {
        $this->assertNotNull(Shape::ellipse());
        $this->assertNotNull(Shape::ellipseId());
    }
}
