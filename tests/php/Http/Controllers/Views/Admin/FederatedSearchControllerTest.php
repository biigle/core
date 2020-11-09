<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use Biigle\Role;
use Biigle\Tests\UserTest;
use TestCase;

class FederatedSearchControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->get('admin/federated-search')->assertRedirect('login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/federated-search')->assertStatus(403);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get('admin/federated-search')->assertStatus(200);
    }
}
