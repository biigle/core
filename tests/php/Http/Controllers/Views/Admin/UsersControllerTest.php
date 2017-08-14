<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class UsersControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->get('admin/users')->assertRedirect('login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/users')->assertStatus(403);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get('admin/users')->assertStatus(200);
    }

    public function testNewWhenNotLoggedIn()
    {
        $this->get('admin/users/new')->assertRedirect('login');
    }

    public function testNewWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/users/new')->assertStatus(403);
    }

    public function testNewWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get('admin/users/new')->assertStatus(200);
    }

    public function testEditWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->get("admin/users/edit/{$id}")->assertRedirect('login');
    }

    public function testEditWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get("admin/users/edit/{$user->id}")->assertStatus(403);
    }

    public function testEditDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $response = $this->get('admin/users/edit/999')->assertStatus(404);
    }

    public function testEditWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get("admin/users/edit/{$id}")->assertStatus(200);
    }

    public function testDeleteWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->get("admin/users/delete/{$id}")->assertRedirect('login');
    }

    public function testDeleteWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get("admin/users/delete/{$user->id}")->assertStatus(403);
    }

    public function testDeleteDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $response = $this->get('admin/users/delete/999')->assertStatus(404);
    }

    public function testDeleteWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get("admin/users/delete/{$id}")->assertStatus(200);
    }

    public function testShowWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->get("admin/users/{$id}")->assertRedirect('login');
    }

    public function testShowWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get("admin/users/{$user->id}")->assertStatus(403);
    }

    public function testShowDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $response = $this->get('admin/users/999')->assertStatus(404);
    }

    public function testShowWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get("admin/users/{$id}")->assertStatus(200);
    }
}
