<?php

use Dias\Image;

class ImageTest extends TestCase {

	public static function create($file = 'test-image.jpg', $transect = false)
	{
		$obj = new Image;
		$obj->filename = $file;
		$transect = $transect ? $transect : TransectTest::create('test', base_path().'/tests/files');
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
		$this->assertNotNull($image->thumbPath);
		$this->assertNotNull($image->url);
		$this->assertNull($image->created_at);
		$this->assertNull($image->updated_at);

		$this->assertNotNull(Image::$thumbPath);
	}

	public function testHiddenAttributes()
	{
		$image = ImageTest::create();
		$image->save();
		$json = json_decode((string) $image);
		$this->assertObjectNotHasAttribute('filename', $json);
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

	public function testProjectIds()
	{
		$image = ImageTest::create();
		$image->save();
		$project = ProjectTest::create();
		$project->save();
		$transect = $image->transect;

		$this->assertEmpty($image->projectIds());
		$project->addTransectId($transect->id);
		// clear caching of previous call
		Cache::flush();
		$ids = $image->projectIds();
		$this->assertNotEmpty($ids);
		$this->assertEquals($project->id, $ids[0]);
	}

	public function testGetThumb()
	{
		$image = ImageTest::create();
		$image->save();
		// remove previously created thumbnail
		File::delete($image->thumbPath);

		// first try to load, then create
		InterventionImage::shouldReceive('make')
			->twice()
			->withAnyArgs()
			->passthru();

		$thumb = $image->getThumb();
		$this->assertNotNull($thumb);
		$this->assertTrue(File::exists($image->thumbPath));

		// now the thumb already exists, so only one call is required
		InterventionImage::shouldReceive('make')
			->once()
			->with($image->thumbPath)
			->passthru();

		$thumb = $image->getThumb();
		$this->assertNotNull($thumb);
	}

	public function testGetFile()
	{
		$image = ImageTest::create();
		$image->save();
		InterventionImage::shouldReceive('make')
			->once()
			->with($image->url)
			->passthru();

		$file = $image->getFile();
		$this->assertNotNull($file);
	}
}