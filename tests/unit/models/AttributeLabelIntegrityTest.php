<?php

class AttributeLabelIntegrityTest extends TestCase {

	public function testAttributeOnDeleteRestrict()
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

		$this->setExpectedException('Illuminate\Database\QueryException');
		$attribute->delete();
	}

	public function testLabelOnDeleteCascade()
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
		$this->assertNotNull($label->attributes()->first());
		$label->delete();
		$this->assertNull($label->attributes()->first());
	}

	public function testAttributeLabelUnique()
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
		$this->setExpectedException('Illuminate\Database\QueryException');
		$label->attributes()->attach($attribute->id, array(
			'value_int'    => 321,
			'value_double' => 4.0,
			'value_string' => 'tset'
		));
	}
}