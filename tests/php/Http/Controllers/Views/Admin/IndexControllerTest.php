<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class IndexControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('admin')->seePageIs('login');
    }

    public function testIndexWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin')->assertResponseStatus(403);
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role()->associate(Role::$admin);
        $this->actingAs($admin)->visit('admin')->seePageIs('admin');
    }
}
