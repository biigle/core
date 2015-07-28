<?php

use Dias\Transect;

class TransectTest extends ModelWithAttributesTest
{
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
        $obj = self::create();
        $this->assertTrue($obj->save());
    }

    public function testAttributes()
    {
        $transect = self::create('test', 'url');
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
        $obj = self::create();
        $obj->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->save();
    }

    public function testUrlRequired()
    {
        $obj = self::create();
        $obj->url = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->save();
    }

    public function testMediaTypeRequired()
    {
        $obj = self::create();
        $obj->mediaType()->dissociate();
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->save();
    }

    public function testMediaTypeOnDeleteRestrict()
    {
        $obj = self::create();
        $obj->save();
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->mediaType()->delete();
    }

    public function testCreatorOnDeleteSetNull()
    {
        $obj = self::create();
        $obj->save();
        $obj->creator()->delete();
        $this->assertNull($obj->fresh()->creator_id);
    }

    public function testImages()
    {
        $transect = self::create();
        $transect->save();
        $image = ImageTest::create('test', $transect);
        $image->save();
        $this->assertEquals($image->id, $transect->images()->first()->id);
    }

    public function testProjects()
    {
        $transect = self::create();
        $transect->save();
        $project = ProjectTest::create();
        $project->save();
        $this->assertEquals(0, $transect->projects()->count());
        $project->addTransectId($transect->id);
        $this->assertEquals(1, $transect->projects()->count());
    }

    public function testProjectIds()
    {
        $transect = self::create();
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
        $transect = self::create();
        $transect->save();
        $type = MediaTypeTest::create();
        $type->save();

        $this->assertNotEquals($type->id, $transect->mediaType->id);
        $transect->setMediaType($type);
        $this->assertEquals($type->id, $transect->mediaType->id);
    }

    public function testSetMediaTypeId()
    {
        $transect = self::create();
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
        $transect = self::create();
        $transect->save();
        $this->assertEmpty($transect->images);
        $transect->createImages(['1.jpg']);
        $transect = $transect->fresh();
        $this->assertNotEmpty($transect->images);
        $this->assertEquals('1.jpg', $transect->images()->first()->filename);
    }
}
