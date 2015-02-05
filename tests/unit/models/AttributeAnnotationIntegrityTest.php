<?php

class AttributeAnnotationIntegrityTest extends TestCase {

	public function testAttributeOnDeleteRestrict()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$annotation->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->setExpectedException('Illuminate\Database\QueryException');
		$attribute->delete();
	}

	public function testAnnotationOnDeleteCascade()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$annotation->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->assertNotNull($annotation->attributes()->first());
		$annotation->delete();
		$this->assertNull($annotation->attributes()->first());
	}

	public function testAttributeAnnotationUnique()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$annotation->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));
		$this->setExpectedException('Illuminate\Database\QueryException');
		$annotation->attributes()->attach($attribute->id, array(
			'value_int'    => 321,
			'value_double' => 4.0,
			'value_string' => 'tset'
		));
	}
}