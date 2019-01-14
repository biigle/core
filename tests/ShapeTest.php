<?php

namespace Tests;

use App\Shape;
use Tests\TestCase;

class ShapeTest extends TestCase
{
    public function testModel()
    {
        $shape = factory(Shape::class)->create();
        $this->assertNotNull($shape->name);
        $this->assertNull($shape->created_at);
        $this->assertNull($shape->updated_at);
    }

    public function testInstances()
    {
        $this->assertTrue(Shape::where('name', 'Point')->exists());
        $this->assertTrue(Shape::where('name', 'Circle')->exists());
    }
}
