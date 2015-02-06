<?php

use Dias\Label;

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

	public function testParentOnDeleteSetNull()
	{
		$parent = LabelTest::create();
		$parent->save();
		$child = LabelTest::create('child', $parent);
		$child->save();

		$parent->delete();
		$this->assertNull($child->fresh()->parent);
	}

	public function testAttributeRelation()
	{
		$label = LabelTest::create();
		$label->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$label->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->assertEquals(1, $label->attributes()->count());

		$attribute = $label->attributes()->first();
		$this->assertEquals(123, $attribute->pivot->value_int);
		$this->assertEquals(0.4, $attribute->pivot->value_double);
		$this->assertEquals('test', $attribute->pivot->value_string);
	}
}