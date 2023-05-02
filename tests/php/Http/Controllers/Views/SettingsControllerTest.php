<?php

namespace Biigle\Tests\Http\Controllers\Views;

use Biigle\Role;
use Biigle\Tests\UserTest;
use TestCase;

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
        foreach (['profile', 'account', 'authentication', 'tokens'] as $page) {
            $this->get("settings/$page")->assertRedirect('login');
        }
    }

    public function testPagesWhenLoggedIn()
    {
        $this->be(UserTest::create());

        foreach (['profile', 'account', 'authentication', 'tokens'] as $page) {
            $this->get("settings/$page")->assertStatus(200);
        }
    }

    public function testTokensGlobalGuest()
    {
        $this->be(UserTest::create(['role_id' => Role::guestId()]));
        $this->get("settings/tokens")->assertStatus(403);
    }
}
