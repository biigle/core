<?php

namespace Dias\Tests\Http\Controllers\Views;

use TestCase;
use Dias\Tests\UserTest;

class SettingsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('settings')->seePageIs('login');
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $this->actingAs(UserTest::create())->visit('settings')->seePageIs('settings/profile');
    }

    public function testPagesWhenNotLoggedIn()
    {
        foreach (['profile', 'account', 'tokens'] as $page) {
            $this->visit("settings/$page")->seePageIs('login');
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
