<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class LogsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('admin/logs')->assertRedirect('login');
    }

    public function testIndexWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/logs')->assertStatus(403);
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->actingAs($admin)->get('admin/logs')->assertViewIs('admin.logs.index');
    }

    public function testIndexWhenDisabled()
    {
        config(['biigle.admin-logs' => false]);
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->actingAs($admin)->get('admin/logs')->assertStatus(404);
    }

    public function testShowWhenNotLoggedIn()
    {
        $this->get('admin/logs/log')->assertRedirect('login');
    }

    public function testShowWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/logs/log')->assertStatus(403);
    }

    public function testShowWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->actingAs($admin)->get('admin/logs/log')->assertStatus(404);
    }
}
