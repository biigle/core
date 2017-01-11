<?php

namespace Biigle\Tests;

use App;
use Mockery;
use ModelTestCase;
use Biigle\LabelSource;

class LabelSourceTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = LabelSource::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testNameUnique()
    {
        self::create(['name' => 'xyz']);
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create(['name' => 'xyz']);
    }

    public function testGetAdapter()
    {
        $mock = Mockery::mock();

        App::singleton('Biigle\Services\LabelSourceAdapters\AbCdAdapter', function () use ($mock) {
            return $mock;
        });

        $source = self::create(['name' => 'ab_cd']);

        $this->assertEquals($mock, $source->getAdapter());
    }
}
