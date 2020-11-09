<?php

namespace Biigle\Tests;

use Biigle\Role;
use Illuminate\Database\QueryException;
use ModelTestCase;

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
        $this->assertEquals('admin', Role::admin()->name);
        $this->assertNotNull(Role::adminId());
    }

    public function testExpert()
    {
        $this->assertEquals('expert', Role::expert()->name);
        $this->assertNotNull(Role::expertId());
    }

    public function testEditor()
    {
        $this->assertEquals('editor', Role::editor()->name);
        $this->assertNotNull(Role::editorId());
    }

    public function testGuest()
    {
        $this->assertEquals('guest', Role::guest()->name);
        $this->assertNotNull(Role::guestId());
    }
}
