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
		$this->setExpectedException('Illuminate\Database\QueryException');

		$obj = ImageTest::create();
		$obj->filename = null;
		$obj->save();
	}

	public function testTransectRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$obj = ImageTest::create();
		$obj->transect()->dissociate()->save();
	}

	public function testFilenameTransectUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$transect = TransectTest::create();
		$obj = ImageTest::create('test', $transect);
		$obj->save();
		$obj = ImageTest::create('test', $transect);
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
}