<?php

class AttributeUserIntegrityTest extends TestCase {

	public function testAttributeOnDeleteRestrict()
	{
		$user = UserTest::create();
		$user->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$user->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->setExpectedException('Illuminate\Database\QueryException');
		$attribute->delete();
	}

	public function testUserOnDeleteCascade()
	{
		$user = UserTest::create();
		$user->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$user->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->assertNotNull($user->attributes()->first());
		$user->delete();
		$this->assertNull($user->attributes()->first());
	}

	public function testAttributeUserUnique()
	{
		$user = UserTest::create();
		$user->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$user->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user->attributes()->attach($attribute->id, array(
			'value_int'    => 321,
			'value_double' => 4.0,
			'value_string' => 'tset'
		));
	}
}