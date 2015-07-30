<?php

use Dias\MediaType;

class MediaTypeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\MediaType::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testNameUnique()
    {
        self::create(['name' => 'images']);
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create(['name' => 'images']);
    }

    public function testTimeSeriesId()
    {
        $this->assertNotNull(MediaType::$timeSeriesId);
    }

    public function testLocationSeriesId()
    {
        $this->assertNotNull(MediaType::$locationSeriesId);
    }
}
