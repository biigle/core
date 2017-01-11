<?php

namespace Biigle\Tests;

use ModelTestCase;
use Biigle\Visibility;

class VisibilityTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Visibility::class;

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

    public function testPublic()
    {
        $this->assertEquals('public', Visibility::$public->name);
    }

    public function testPrivate()
    {
        $this->assertEquals('private', Visibility::$private->name);
    }
}
