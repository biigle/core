<?php

namespace Biigle\Tests;

use Biigle\Visibility;
use Illuminate\Database\QueryException;
use ModelTestCase;

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
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testNameUnique()
    {
        self::create(['name' => 'xyz']);
        $this->expectException(QueryException::class);
        self::create(['name' => 'xyz']);
    }

    public function testPublic()
    {
        $this->assertSame('public', Visibility::public()->name);
    }

    public function testPrivate()
    {
        $this->assertSame('private', Visibility::private()->name);
    }
}
