<?php

use Dias\Label;

class LabelTest extends ModelWithAttributesTest {

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
		$image = LabelTest::create('test', null, 0);
		$image->save();
		$this->assertNotNull($image->name);
		$this->assertNotNull($image->aphia_id);
		$this->assertNull($image->created_at);
		$this->assertNull($image->updated_at);
	}

	public function testNameRequired()
	{
		$obj = LabelTest::create();
		$obj->name = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
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

	public function testParentOnDeleteCascade()
	{
		$parent = LabelTest::create();
		$parent->save();
		$child = LabelTest::create('child', $parent);
		$child->save();

		$parent->delete();
		$this->assertNull($child->fresh());
	}

	public function testChildren()
	{
		$parent = LabelTest::create();
		$parent->save();
		$child = LabelTest::create('child', $parent);
		$child->save();

		$this->assertEquals($child->id, $parent->children()->first()->id);
	}

	public function testHasParent()
	{
		$parent = LabelTest::create();
		$parent->save();
		$child = LabelTest::create();
		$child->save();

		$this->assertFalse($child->hasParent);
		$child->parent()->associate($parent);
		$child->save();
		$this->assertTrue($child->hasParent);
	}

	public function testHasChildren()
	{
		$parent = LabelTest::create();
		$parent->save();
		$child = LabelTest::create();
		$child->save();

		$this->assertFalse($parent->hasChildren);
		$child->parent()->associate($parent);
		$child->save();
		$this->assertTrue($parent->hasChildren);
	}
}