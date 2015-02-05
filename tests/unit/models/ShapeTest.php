<?php

use Dias\Shape;

class ShapeTest extends TestCase {

	public static function create($name = 'test')
	{
		$obj = new Shape;
		$obj->name = $name;
		return $obj;
	}

	public function testCreation()
	{
		$obj = ShapeTest::create();
		$this->assertTrue($obj->save());
	}

	public function testAttributes()
	{
		$shape = ShapeTest::create();
		$shape->save();
		$this->assertNotNull($shape->name);
		$this->assertNull($shape->created_at);
		$this->assertNull($shape->updated_at);
	}

	public function testNameRequired()
	{
		$obj = ShapeTest::create();
		$obj->name = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}
}