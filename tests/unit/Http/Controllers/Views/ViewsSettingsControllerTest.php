<?php

class ViewsSettingsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('settings')->seePageIs('auth/login');
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $this->actingAs(UserTest::create())->visit('settings')->seePageIs('settings/profile');
    }

    public function testPagesWhenNotLoggedIn()
    {
        foreach (['profile', 'account', 'tokens'] as $page) {
            $this->visit("settings/$page")->seePageIs('auth/login');
        }
    }

    public function testPagesWhenLoggedIn()
    {
        $this->be(UserTest::create());

        foreach (['profile', 'account', 'tokens'] as $page) {
            $this->visit("settings/$page")->assertResponseOk();
        }
    }
}
