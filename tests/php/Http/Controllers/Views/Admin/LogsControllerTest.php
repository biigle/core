<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class LogsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('admin/logs')->seePageIs('login');
    }

    public function testIndexWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/logs')->assertResponseStatus(403);
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->actingAs($admin)->visit('admin/logs')->seePageIs('admin/logs');
    }

    public function testIndexWhenDisabled()
    {
        config(['biigle.admin-logs' => false]);
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->actingAs($admin)->get('admin/logs')->assertResponseStatus(404);
    }

    public function testShowWhenNotLoggedIn()
    {
        $this->visit('admin/logs/log')->seePageIs('login');
    }

    public function testShowWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/logs/log')->assertResponseStatus(403);
    }

    public function testShowWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->actingAs($admin)->get('admin/logs/log')->assertResponseStatus(404);
    }
}
