<?php

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
		$this->setExpectedException('Illuminate\Database\QueryException');

		$obj = TransectTest::create();
		$obj->name = null;
		$obj->save();
	}

	public function testMediaTypeRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$obj = TransectTest::create();
		$obj->mediaType()->dissociate();
		$obj->save();
	}

	public function testMediaTypeOnDeleteRestrict()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$obj = TransectTest::create();
		$obj->save();
		$obj->mediaType()->delete();
	}

	public function testCreatorOnDeleteSetNull()
	{
		$obj = TransectTest::create();
		$obj->save();
		$obj->creator()->delete();
		// refresh object
		$obj = Transect::find($obj->id);
		$this->assertNull($obj->creator_id);
	}
}