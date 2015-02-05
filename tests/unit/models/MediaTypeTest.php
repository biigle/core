<?php

use Dias\MediaType;

class MediaTypeTest extends TestCase {

	public static function create($name = 'images')
	{
		$mediaType = new MediaType;
		$mediaType->name = $name;
		return $mediaType;
	}

	public function testCreation()
	{
		$mediaType = MediaTypeTest::create();
		$this->assertTrue($mediaType->save());
	}

	public function testAttributes()
	{
		$mediaType = MediaTypeTest::create();
		$mediaType->save();
		$this->assertNotNull($mediaType->name);
		$this->assertNull($mediaType->created_at);
		$this->assertNull($mediaType->updated_at);
	}

	public function testNameRequired()
	{
		$obj = MediaTypeTest::create();
		$obj->name = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testNameUnique()
	{
		$obj = MediaTypeTest::create();
		$obj->save();
		$obj = MediaTypeTest::create();
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}
}