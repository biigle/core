<?php

use Dias\MediaType;

class MediaTypeTest extends TestCase
{
    public static function create($name = false)
    {
        $mediaType = new MediaType;
        $mediaType->name = $name ? $name : str_random(10);

        return $mediaType;
    }

    public function testCreation()
    {
        $mediaType = self::create();
        $this->assertTrue($mediaType->save());
    }

    public function testAttributes()
    {
        $mediaType = self::create();
        $mediaType->save();
        $this->assertNotNull($mediaType->name);
        $this->assertNull($mediaType->created_at);
        $this->assertNull($mediaType->updated_at);
    }

    public function testNameRequired()
    {
        $obj = self::create();
        $obj->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->save();
    }

    public function testNameUnique()
    {
        $obj = self::create('images');
        $obj->save();
        $obj = self::create('images');
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->save();
    }

    public function testTimeSeriesId()
    {
        $this->assertNotNull(MediaType::timeSeriesId());
    }

    public function testLocationSeriesId()
    {
        $this->assertNotNull(MediaType::locationSeriesId());
    }
}
