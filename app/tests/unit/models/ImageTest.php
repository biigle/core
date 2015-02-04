<?php

class ImageTest extends TestCase {

	public static function create($file = 'test', $transect = false)
	{
		$obj = new Image;
		$obj->filename = $file;
		$transect = $transect ? $transect : TransectTest::create();
		$transect->save();
		$obj->transect()->associate($transect);
		return $obj;
	}

	public function testCreation()
	{
		$obj = ImageTest::create();
		$this->assertTrue($obj->save());
	}

	public function testAttributes()
	{
		$image = ImageTest::create();
		$image->save();
		$this->assertNotNull($image->filename);
		$this->assertNotNull($image->transect_id);
		$this->assertNull($image->created_at);
		$this->assertNull($image->updated_at);
	}

	public function testFilenameRequired()
	{
		$obj = ImageTest::create();
		$obj->filename = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testTransectRequired()
	{
		$obj = ImageTest::create();
		$obj->transect()->dissociate();
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testFilenameTransectUnique()
	{
		$transect = TransectTest::create();
		$obj = ImageTest::create('test', $transect);
		$obj->save();
		$obj = ImageTest::create('test', $transect);
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testAnnotations()
	{
		$image = ImageTest::create();
		$annotation = AnnotationTest::create($image);
		$annotation->save();
		AnnotationTest::create($image)->save();
		$this->assertEquals(2, $image->annotations()->count());
		$this->assertEquals($annotation->id, $image->annotations()->first()->id);
	}

	public function testAttributeRelation()
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

		$this->assertEquals(1, $image->attributes()->count());

		$attribute = $image->attributes()->first();
		$this->assertEquals(123, $attribute->pivot->value_int);
		$this->assertEquals(0.4, $attribute->pivot->value_double);
		$this->assertEquals('test', $attribute->pivot->value_string);
	}
}