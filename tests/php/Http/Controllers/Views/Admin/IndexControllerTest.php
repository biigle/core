<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use Biigle\Role;
use Biigle\Tests\UserTest;
use TestCase;

class IndexControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('admin')->assertRedirect('login');
    }

    public function testIndexWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin')->assertStatus(403);
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->actingAs($admin)->get('admin')->assertViewIs('admin.index');
    }
}
