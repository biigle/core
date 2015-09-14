<?php

class ViewsAdminControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('admin')->seePageIs('auth/login');
    }

    public function testIndexWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin')->assertResponseStatus(401);
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->actingAs($admin)->visit('admin')->seePageIs('admin');
    }

    public function testUsersWhenNotLoggedIn()
    {
        $this->visit("admin/users")->seePageIs('auth/login');
    }

    public function testUsersWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get("admin/users")->assertResponseStatus(401);
    }

    public function testUsersWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit("admin/users")->assertResponseOk();
    }
}
