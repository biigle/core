<?php

namespace Biigle\Tests\Http\Controllers\Views;

use TestCase;
use Biigle\Tests\UserTest;

class SettingsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('settings')->assertRedirect('login');
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $this->actingAs(UserTest::create())
            ->get('settings')
            ->assertRedirect('settings/profile');
    }

    public function testPagesWhenNotLoggedIn()
    {
        foreach (['profile', 'account', 'tokens'] as $page) {
            $this->get("settings/$page")->assertRedirect('login');
        }
    }

    public function testPagesWhenLoggedIn()
    {
        $this->be(UserTest::create());

        foreach (['profile', 'account', 'tokens'] as $page) {
            $this->get("settings/$page")->assertStatus(200);
        }
    }
}
