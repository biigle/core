<?php

namespace Biigle\Tests;

use ModelTestCase;
use Biigle\MediaType;
use Illuminate\Database\QueryException;

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
        self::create(['name' => 'images']);
        $this->expectException(QueryException::class);
        self::create(['name' => 'images']);
    }

    public function testTimeSeries()
    {
        $this->assertNotNull(MediaType::timeSeries());
        $this->assertNotNull(MediaType::timeSeriesId());
    }

    public function testLocationSeries()
    {
        $this->assertNotNull(MediaType::locationSeries());
        $this->assertNotNull(MediaType::locationSeriesId());
    }
}
