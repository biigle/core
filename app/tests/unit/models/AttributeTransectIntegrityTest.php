<?php

class AttributeTransectIntegrityTest extends TestCase {

	public function testAttributeOnDeleteRestrict()
	{
		$transect = TransectTest::create();
		$transect->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$transect->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->setExpectedException('Illuminate\Database\QueryException');
		$attribute->delete();
	}

	public function testTransectOnDeleteCascade()
	{
		$transect = TransectTest::create();
		$transect->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$transect->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->assertNotNull($transect->attributes()->first());
		$transect->delete();
		$this->assertNull($transect->attributes()->first());
	}

	public function testAttributeTransectUnique()
	{
		$transect = TransectTest::create();
		$transect->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$transect->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->setExpectedException('Illuminate\Database\QueryException');
		$transect->attributes()->attach($attribute->id, array(
			'value_int'    => 321,
			'value_double' => 4.0,
			'value_string' => 'tset'
		));
	}
}