<?php

use Dias\Role;

class RoleTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\Role::class;

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
        $project->addUserId($user->id, $this->model->id);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->delete();
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
