<?php

class ViewsAdminIndexControllerTest extends TestCase
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
}
