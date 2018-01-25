<?php

namespace Biigle\Tests;

use Biigle\Role;
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
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testNameUnique()
    {
        self::create(['name' => 'xyz']);
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create(['name' => 'xyz']);
    }

    public function testOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $role = Role::$guest;
        $project->addUserId($user->id, $role->id);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $role->delete();
    }

    public function testAdminId()
    {
        $this->assertNotNull(Role::$admin->id);
    }

    public function testAdmin()
    {
        $this->assertEquals('admin', Role::$admin->name);
    }

    public function testEditorId()
    {
        $this->assertNotNull(Role::$editor->id);
    }

    public function testEditor()
    {
        $this->assertEquals('editor', Role::$editor->name);
    }

    public function testGuestId()
    {
        $this->assertNotNull(Role::$guest->id);
    }

    public function testGuest()
    {
        $this->assertEquals('guest', Role::$guest->name);
    }
}
