<?php

abstract class ModelWithAttributesTest extends TestCase {

	abstract static function create();

	public function testAttributesExist()
	{
		$model = static::create();
		$model->save();
		$this->assertNotNull($model->attributes);
	}

	public function testAttributeRelation()
	{
		$model = static::create();
		$model->save();
		$attribute = AttributeTest::create();
		$this->assertEquals(0, $model->attributes()->count());
		$model->attributes()->save($attribute, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->assertEquals(1, $model->attributes()->count());

		$attribute = $model->attributes()->first();
		$this->assertEquals(123, $attribute->value_int);
		$this->assertEquals(0.4, $attribute->value_double);
		$this->assertEquals('test', $attribute->value_string);
	}

	// PIVOT TABLE INTEGRITY TESTS

	public function testAttributeOnDeleteRestrict()
	{
		$model = static::create();
		$model->save();
		$attribute = AttributeTest::create();
		$model->attributes()->save($attribute, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->setExpectedException('Illuminate\Database\QueryException');
		$attribute->delete();
	}

	public function testModelOnDeleteCascade()
	{
		$model = static::create();
		$model->save();
		$attribute = AttributeTest::create();
		$model->attributes()->save($attribute, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->assertNotNull($model->attributes()->first());
		$model->delete();
		$this->assertNull($model->attributes()->first());
		// only pivot table entry is deleted
		$this->assertNotNull($attribute->fresh());
	}

	public function testAttributeModelUnique()
	{
		$model = static::create();
		$model->save();
		$attribute = AttributeTest::create();
		$model->attributes()->save($attribute, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->setExpectedException('Illuminate\Database\QueryException');
		$model->attributes()->save($attribute, array(
			'value_int'    => 321,
			'value_double' => 4.0,
			'value_string' => 'test'
		));
	}
}