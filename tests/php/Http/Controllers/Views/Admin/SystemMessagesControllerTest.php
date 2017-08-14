<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\SystemMessageTest;

class SystemMessagesControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->get('admin/system-messages')->assertRedirect('login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/system-messages')->assertStatus(403);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get('admin/system-messages')->assertStatus(200);
    }

    public function testNewWhenNotLoggedIn()
    {
        $this->get('admin/system-messages/new')->assertRedirect('login');
    }

    public function testNewWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/system-messages/new')->assertStatus(403);
    }

    public function testNewWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get('admin/system-messages/new')->assertStatus(200);
    }

    public function testEditWhenNotLoggedIn()
    {
        $id = SystemMessageTest::create()->id;
        $this->get("admin/system-messages/{$id}")->assertRedirect('login');
    }

    public function testEditWhenNotAdmin()
    {
        $id = SystemMessageTest::create()->id;
        $this->be(UserTest::create());
        $response = $this->get("admin/system-messages/{$id}")->assertStatus(403);
    }

    public function testEditDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $response = $this->get('admin/system-messages/999')->assertStatus(404);
    }

    public function testEditWhenLoggedIn()
    {
        $id = SystemMessageTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->be($admin);
        $this->get("admin/system-messages/{$id}")->assertStatus(200);
    }
}
