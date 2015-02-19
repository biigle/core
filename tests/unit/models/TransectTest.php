<?php

use Dias\Transect;

class TransectTest extends TestCase {

	public static function create($name = 't1', $url = false, $mt = false, $u = false)
	{
		$obj = new Transect;
		$obj->name = $name;
		$obj->url = $url ? $url : str_random(5);
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

	public function testUrlRequired()
	{
		$obj = TransectTest::create();
		$obj->url = null;
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

	public function testImages()
	{
		$transect = TransectTest::create();
		$transect->save();
		$image = ImageTest::create('test', $transect);
		$image->save();
		$this->assertEquals($image->id, $transect->images()->first()->id);
	}

	public function testProjects()
	{
		$transect = TransectTest::create();
		$transect->save();
		$project = ProjectTest::create();
		$project->save();
		$this->assertEquals(0, $transect->projects()->count());
		$project->addTransectId($transect->id);
		$this->assertEquals(1, $transect->projects()->count());
	}

	public function testProjectIds()
	{
		$transect = TransectTest::create();
		$transect->save();
		$project = ProjectTest::create();
		$project->save();
		$this->assertEmpty($transect->projectIds());
		$project->addTransectId($transect->id);
		// clear caching of previous call
		Cache::flush();
		$ids = $transect->projectIds();
		$this->assertNotEmpty($ids);
		$this->assertEquals($project->id, $ids[0]);
	}

	public function testSetMediaType()
	{
		$transect = TransectTest::create();
		$transect->save();
		$type = MediaTypeTest::create();
		$type->save();

		$this->assertNotEquals($type->id, $transect->mediaType->id);
		$transect->setMediaType($type);
		$this->assertEquals($type->id, $transect->mediaType->id);
	}

	public function testSetMediaTypeId()
	{
		$transect = TransectTest::create();
		$transect->save();
		$type = MediaTypeTest::create();
		$type->save();

		$this->assertNotEquals($type->id, $transect->mediaType->id);
		$transect->setMediaTypeId($type->id);
		$this->assertEquals($type->id, $transect->mediaType->id);

		// media type does not exist
		$this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
		$transect->setMediaTypeId(99999);
	}

	public function testCreateImages()
	{
		$transect = TransectTest::create();
		$transect->save();
		$this->assertEmpty($transect->images);
		$transect->createImages(array("1.jpg"));
		$transect = $transect->fresh();
		$this->assertNotEmpty($transect->images);
		$this->assertEquals('1.jpg', $transect->images()->first()->filename);
	}
}