<?php

class ViewsAdminUsersControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->visit('admin/users')->seePageIs('auth/login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/users')->assertResponseStatus(401);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit('admin/users')->assertResponseOk();
    }

    public function testNewWhenNotLoggedIn()
    {
        $this->visit('admin/users/new')->seePageIs('auth/login');
    }

    public function testNewWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/users/new')->assertResponseStatus(401);
    }

    public function testNewWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit('admin/users/new')->assertResponseOk();
    }

    public function testEditWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->visit("admin/users/edit/{$id}")->seePageIs('auth/login');
    }

    public function testEditWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/users/edit/{$user->id}")->assertResponseStatus(401);
    }

    public function testEditDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->get("admin/users/edit/999")->assertResponseStatus(404);
    }

    public function testEditWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit("admin/users/edit/{$id}")->assertResponseOk();
    }

    public function testDeleteWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->visit("admin/users/delete/{$id}")->seePageIs('auth/login');
    }

    public function testDeleteWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/users/delete/{$user->id}")->assertResponseStatus(401);
    }

    public function testDeleteDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->get("admin/users/delete/999")->assertResponseStatus(404);
    }

    public function testDeleteWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit("admin/users/delete/{$id}")->assertResponseOk();
    }
}
