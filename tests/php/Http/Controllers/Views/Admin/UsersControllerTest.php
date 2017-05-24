<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class UsersControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->visit('admin/users')->seePageIs('login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/users')->assertResponseStatus(403);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->visit('admin/users')->assertResponseOk();
    }

    public function testNewWhenNotLoggedIn()
    {
        $this->visit('admin/users/new')->seePageIs('login');
    }

    public function testNewWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/users/new')->assertResponseStatus(403);
    }

    public function testNewWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->visit('admin/users/new')->assertResponseOk();
    }

    public function testEditWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->visit("admin/users/edit/{$id}")->seePageIs('login');
    }

    public function testEditWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/users/edit/{$user->id}")->assertResponseStatus(403);
    }

    public function testEditDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get('admin/users/edit/999')->assertResponseStatus(404);
    }

    public function testEditWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->visit("admin/users/edit/{$id}")->assertResponseOk();
    }

    public function testDeleteWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->visit("admin/users/delete/{$id}")->seePageIs('login');
    }

    public function testDeleteWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/users/delete/{$user->id}")->assertResponseStatus(403);
    }

    public function testDeleteDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get('admin/users/delete/999')->assertResponseStatus(404);
    }

    public function testDeleteWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->visit("admin/users/delete/{$id}")->assertResponseOk();
    }

    public function testShowWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->visit("admin/users/{$id}")->seePageIs('login');
    }

    public function testShowWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/users/{$user->id}")->assertResponseStatus(403);
    }

    public function testShowDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get('admin/users/999')->assertResponseStatus(404);
    }

    public function testShowWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->visit("admin/users/{$id}")->assertResponseOk();
    }
}
