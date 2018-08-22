<?php

namespace Biigle\Tests;

use Biigle\Role;
use ModelTestCase;
use Illuminate\Database\QueryException;

class RoleTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Role::class;

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
        $project = ProjectTest::create();
        $user = UserTest::create();
        $project->addUserId($user->id, $this->model->id);
        $this->expectException(QueryException::class);
        $this->model->delete();
    }

    public function testAdmin()
    {
        $this->assertEquals('admin', Role::$admin->name);
    }

    public function testExpert()
    {
        $this->assertEquals('expert', Role::$expert->name);
    }

    public function testEditor()
    {
        $this->assertEquals('editor', Role::$editor->name);
    }

    public function testGuest()
    {
        $this->assertEquals('guest', Role::$guest->name);
    }
}
