<?php

namespace Biigle\Tests;

use Biigle\MediaType;
use Illuminate\Database\QueryException;
use ModelTestCase;

class MediaTypeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = MediaType::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testNameUnique()
    {
        self::create(['name' => 'test']);
        $this->expectException(QueryException::class);
        self::create(['name' => 'test']);
    }

    public function testImage()
    {
        $this->assertNotNull(MediaType::image());
        $this->assertNotNull(MediaType::imageId());
    }

    public function testVideo()
    {
        $this->assertNotNull(MediaType::video());
        $this->assertNotNull(MediaType::videoId());
    }
}
