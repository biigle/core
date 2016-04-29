<?php

class ViewsAdminLabelsControllerTest extends TestCase
{
    public function testLabelsWhenNotLoggedIn()
    {
        $this->visit('admin/labels')->seePageIs('auth/login');
    }

    public function testLabelsWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $this->get('admin/labels')->assertResponseStatus(401);
    }

    public function testLabelsWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Dias\Role::$admin);
        $this->be($admin);
        $this->visit('admin/labels')->assertResponseOk();
    }
}
