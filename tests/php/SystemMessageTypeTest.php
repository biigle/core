<?php

namespace Biigle\Tests;

use ModelTestCase;
use Biigle\SystemMessageType;
use Illuminate\Database\QueryException;

class SystemMessageTypeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = SystemMessageType::class;

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

    public function testOnDeleteRestrict()
    {
        $message = SystemMessageTest::create();
        $this->expectException(QueryException::class);
        $message->type()->delete();
    }

    public function testImportant()
    {
        $this->assertEquals('important', SystemMessageType::$important->name);
    }

    public function testUpdate()
    {
        $this->assertEquals('update', SystemMessageType::$update->name);
    }

    public function testInfo()
    {
        $this->assertEquals('info', SystemMessageType::$info->name);
    }
}
