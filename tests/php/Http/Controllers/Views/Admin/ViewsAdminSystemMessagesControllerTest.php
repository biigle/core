<?php

class ViewsAdminSystemMessagesControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->visit('admin/system-messages')->seePageIs('login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/system-messages')->assertResponseStatus(403);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit('admin/system-messages')->assertResponseOk();
    }

    public function testNewWhenNotLoggedIn()
    {
        $this->visit('admin/system-messages/new')->seePageIs('login');
    }

    public function testNewWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/system-messages/new')->assertResponseStatus(403);
    }

    public function testNewWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit('admin/system-messages/new')->assertResponseOk();
    }

    public function testEditWhenNotLoggedIn()
    {
        $id = SystemMessageTest::create()->id;
        $this->visit("admin/system-messages/{$id}")->seePageIs('login');
    }

    public function testEditWhenNotAdmin()
    {
        $id = SystemMessageTest::create()->id;
        $this->be(UserTest::create());
        $this->get("admin/system-messages/{$id}")->assertResponseStatus(403);
    }

    public function testEditDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->get("admin/system-messages/999")->assertResponseStatus(404);
    }

    public function testEditWhenLoggedIn()
    {
        $id = SystemMessageTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit("admin/system-messages/{$id}")->assertResponseOk();
    }
}
