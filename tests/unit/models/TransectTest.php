<?php

use Dias\Transect;

class TransectTest extends TestCase {

	public static function create($name = 't1', $url = null, $mt = false, $u = false)
	{
		$obj = new Transect;
		$obj->name = $name;
		$obj->url = $url;
		$u = $u ? $u : UserTest::create();
		$u->save();
		$obj->creator()->associate($u);
		$mt = $mt ? $mt : MediaTypeTest::create();
		$mt->save();
		$obj->mediaType()->associate($mt);
		return $obj;
	}

	public function testCreation()
	{
		$obj = TransectTest::create();
		$this->assertTrue($obj->save());
	}

	public function testAttributes()
	{
		$transect = TransectTest::create('test', 'url');
		$transect->save();
		$this->assertNotNull($transect->name);
		$this->assertNotNull($transect->url);
		$this->assertNotNull($transect->media_type_id);
		$this->assertNotNull($transect->creator_id);
		$this->assertNotNull($transect->created_at);
		$this->assertNotNull($transect->updated_at);
	}

	public function testNameRequired()
	{
		$obj = TransectTest::create();
		$obj->name = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testMediaTypeRequired()
	{
		$obj = TransectTest::create();
		$obj->mediaType()->dissociate();
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testMediaTypeOnDeleteRestrict()
	{
		$obj = TransectTest::create();
		$obj->save();
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->mediaType()->delete();
	}

	public function testCreatorOnDeleteSetNull()
	{
		$obj = TransectTest::create();
		$obj->save();
		$obj->creator()->delete();
		$this->assertNull($obj->fresh()->creator_id);
	}

	public function testAttributeRelation()
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

		$this->assertEquals(1, $transect->attributes()->count());

		$attribute = $transect->attributes()->first();
		$this->assertEquals(123, $attribute->pivot->value_int);
		$this->assertEquals(0.4, $attribute->pivot->value_double);
		$this->assertEquals('test', $attribute->pivot->value_string);
	}
}