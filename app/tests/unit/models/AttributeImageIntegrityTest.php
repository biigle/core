<?php

class AttributeImageIntegrityTest extends TestCase {

	public function testAttributeOnDeleteRestrict()
	{
		$image = ImageTest::create();
		$image->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$image->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->setExpectedException('Illuminate\Database\QueryException');
		$attribute->delete();
	}

	public function testImageOnDeleteCascade()
	{
		$image = ImageTest::create();
		$image->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$image->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->assertNotNull($image->attributes()->first());
		$image->delete();
		$this->assertNull($image->attributes()->first());
	}

	public function testAttributeImageUnique()
	{
		$image = ImageTest::create();
		$image->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$image->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->setExpectedException('Illuminate\Database\QueryException');
		$image->attributes()->attach($attribute->id, array(
			'value_int'    => 321,
			'value_double' => 4.0,
			'value_string' => 'tset'
		));
	}
}