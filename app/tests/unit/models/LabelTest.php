<?php

class LabelTest extends TestCase {

	public static function create($name = 'test', $parent = null, $aphiaId = null)
	{
		$obj = new Label;
		$obj->name = $name;
		if ($parent) $obj->parent()->associate($parent);
		$obj->aphia_id = $aphiaId;
		return $obj;
	}

	public function testCreation()
	{
		$obj = LabelTest::create();
		$this->assertTrue($obj->save());
	}

	public function testAttributes()
	{
		$image = LabelTest::create('test', null, 'test');
		$image->save();
		$this->assertNotNull($image->name);
		$this->assertNotNull($image->aphia_id);
		$this->assertNull($image->created_at);
		$this->assertNull($image->updated_at);
	}

	public function testNameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$obj = LabelTest::create();
		$obj->name = null;
		$obj->save();
	}

	public function testParent()
	{
		$parent = LabelTest::create();
		$parent->save();
		$child = LabelTest::create('child', $parent);
		$child->save();

		$this->assertEquals($parent->id, $child->parent->id);
	}

	public function testParentOnDeleteSetNull()
	{
		$parent = LabelTest::create();
		$parent->save();
		$child = LabelTest::create('child', $parent);
		$child->save();

		$parent->delete();
		// refresh child
		$child = Label::find($child->id);

		$this->assertNull($child->parent);
	}
}