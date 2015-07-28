<?php

use Dias\Role;

class RoleTest extends TestCase
{
    public static function create($name = 'member')
    {
        $role = new Role;
        $role->name = $name;

        return $role;
    }

    public function testCreation()
    {
        $role = self::create();
        $this->assertTrue($role->save());
    }

    public function testAttributes()
    {
        $role = self::create();
        $role->save();
        $this->assertNotNull($role->name);
    }

    public function testNameRequired()
    {
        $role = self::create();
        $role->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $role->save();
    }

    public function testNameUnique()
    {
        $role = self::create();
        $role->save();
        $role = self::create();
        $this->setExpectedException('Illuminate\Database\QueryException');
        $role->save();
    }

    public function testOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $project->save();
        $user = UserTest::create();
        $user->save();
        $role = self::create();
        $role->save();
        $project->addUserId($user->id, $role->id);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $role->delete();
    }

    public function testAdminId()
    {
        $this->assertNotNull(Role::adminId());
    }

    public function testAdmin()
    {
        $this->assertEquals('admin', Role::admin()->name);
    }

    public function testEditorId()
    {
        $this->assertNotNull(Role::editorId());
    }

    public function testEditor()
    {
        $this->assertEquals('editor', Role::editor()->name);
    }

    public function testGuestId()
    {
        $this->assertNotNull(Role::guestId());
    }

    public function testGuest()
    {
        $this->assertEquals('guest', Role::guest()->name);
    }
}
